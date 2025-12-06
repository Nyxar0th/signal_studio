import { useEffect, useState } from "react";
import type { Signal } from "./types/signal";
import { Signal_card } from "./components/Signal_card";
import { Signal_detail_modal } from "./components/Signal_detail_modal";
import { use_random_signal_updates } from "./hooks/use_random_signal_updates";
import { use_signal_stream } from "./hooks/use_signal_stream";
import {
  use_event_history,
  type Event_thresholds
} from "./hooks/use_event_history";
import { use_stream_metrics } from "./hooks/use_stream_metrics";
import { Sparkline_dots } from "./components/Sparkline_dots";

type Alert_kind = "load" | "latency" | "error" | "status";

interface Alert_item {
  id: string;
  signal_id: string;
  signal_label: string;
  kind: Alert_kind;
  message: string;
  severity: "warning" | "critical";
}

interface Settings_state extends Event_thresholds {
  alert_load_threshold: number;
  alert_latency_threshold: number;
  alert_error_threshold: number;
}

function build_alerts(signals: Signal[], settings: Settings_state): Alert_item[] {
  const alerts: Alert_item[] = [];

  const load_warn = settings.alert_load_threshold;
  const load_crit = load_warn + 10;

  const latency_warn = settings.alert_latency_threshold;
  const latency_crit = latency_warn + 100;

  const error_warn = settings.alert_error_threshold;
  const error_crit = error_warn + 8;

  signals.forEach((signal) => {
    const base_id = signal.id;

    if (signal.load_pct >= load_warn) {
      alerts.push({
        id: `${base_id}_load`,
        signal_id: signal.id,
        signal_label: signal.label,
        kind: "load",
        message: `High load at ${signal.load_pct}%`,
        severity: signal.load_pct >= load_crit ? "critical" : "warning"
      });
    }

    if (signal.latency_ms > 0 && signal.latency_ms >= latency_warn) {
      alerts.push({
        id: `${base_id}_latency`,
        signal_id: signal.id,
        signal_label: signal.label,
        kind: "latency",
        message: `Latency at ${signal.latency_ms} ms`,
        severity: signal.latency_ms >= latency_crit ? "critical" : "warning"
      });
    }

    if (signal.error_rate > error_warn) {
      alerts.push({
        id: `${base_id}_error`,
        signal_id: signal.id,
        signal_label: signal.label,
        kind: "error",
        message: `Error rate at ${signal.error_rate.toFixed(1)}%`,
        severity: signal.error_rate >= error_crit ? "critical" : "warning"
      });
    }

    if (signal.status === "down" || signal.status === "degraded") {
      alerts.push({
        id: `${base_id}_status`,
        signal_id: signal.id,
        signal_label: signal.label,
        kind: "status",
        message:
          signal.status === "down"
            ? "Service is down"
            : "Service is degraded",
        severity: signal.status === "down" ? "critical" : "warning"
      });
    }
  });

  return alerts;
}

function App() {
  const [mode, set_mode] = useState<"mock" | "live">("mock");

  const [nav_active, set_nav_active] = useState<
    "overview" | "streams" | "alerts" | "settings"
  >("overview");

  const [sort_key, set_sort_key] = useState<
    "none" | "load" | "latency" | "error" | "status"
  >("none");

  const [filter_state, set_filter_state] = useState<
    "all" | "healthy" | "degraded" | "down"
  >("all");

  const [selected_signal_id, set_selected_signal_id] = useState<string | null>(
    null
  );

  const [settings, set_settings] = useState<Settings_state>(() => {
    if (typeof window === "undefined") {
      return {
        alert_load_threshold: 85,
        alert_latency_threshold: 220,
        alert_error_threshold: 2,
        spike_load_threshold: 95,
        spike_latency_threshold: 320,
        spike_error_threshold: 10
      };
    }

    try {
      const stored = window.localStorage.getItem("signal_studio_settings");
      if (stored) {
        const parsed = JSON.parse(stored) as Settings_state;
        return {
          alert_load_threshold: parsed.alert_load_threshold ?? 85,
          alert_latency_threshold: parsed.alert_latency_threshold ?? 220,
          alert_error_threshold: parsed.alert_error_threshold ?? 2,
          spike_load_threshold: parsed.spike_load_threshold ?? 95,
          spike_latency_threshold: parsed.spike_latency_threshold ?? 320,
          spike_error_threshold: parsed.spike_error_threshold ?? 10
        };
      }
    } catch {
      // ignore
    }

    return {
      alert_load_threshold: 85,
      alert_latency_threshold: 220,
      alert_error_threshold: 2,
      spike_load_threshold: 95,
      spike_latency_threshold: 320,
      spike_error_threshold: 10
    };
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "signal_studio_settings",
        JSON.stringify(settings)
      );
    } catch {
      // ignore
    }
  }, [settings]);

  const signals_mock = use_random_signal_updates();
  const { signals: signals_live } = use_signal_stream(
    "ws://localhost:8080",
    mode === "live"
  );

  const is_live = mode === "live";
  const active_signals = is_live ? signals_live : signals_mock;

  const event_history = use_event_history(active_signals, {
    spike_load_threshold: settings.spike_load_threshold,
    spike_latency_threshold: settings.spike_latency_threshold,
    spike_error_threshold: settings.spike_error_threshold
  });

  const stream_metrics = use_stream_metrics(
    is_live ? "live" : "mock",
    active_signals
  );

  const nav_items: {
    id: "overview" | "streams" | "alerts" | "settings";
    label: string;
  }[] = [
    { id: "overview", label: "Overview" },
    { id: "streams", label: "Streams" },
    { id: "alerts", label: "Alerts" },
    { id: "settings", label: "Settings" }
  ];

  const status_order: Record<string, number> = {
    healthy: 3,
    degraded: 2,
    down: 1
  };

  const sorted_filtered = [...active_signals]
    .filter((signal) => {
      if (filter_state === "all") return true;
      return signal.status === filter_state;
    })
    .sort((a, b) => {
      if (sort_key === "none") return 0;
      if (sort_key === "load") return b.load_pct - a.load_pct;
      if (sort_key === "latency") return b.latency_ms - a.latency_ms;
      if (sort_key === "error") return b.error_rate - a.error_rate;

      const a_score = status_order[a.status] ?? 0;
      const b_score = status_order[b.status] ?? 0;
      return b_score - a_score;
    });

  const alerts = build_alerts(sorted_filtered, settings);
  const active_alert_count = alerts.length;
  const alert_signal_ids = new Set(alerts.map((alert) => alert.signal_id));

  const selected_signal =
    selected_signal_id != null
      ? active_signals.find((signal) => signal.id === selected_signal_id) ??
        null
      : null;

  const show_alerts_view = nav_active === "alerts";
  const show_settings_view = nav_active === "settings";
  const show_streams_view = nav_active === "streams";

  const last_update_label =
    stream_metrics.last_update_at != null
      ? new Date(stream_metrics.last_update_at).toLocaleTimeString()
      : "Waiting";

  const avg_interval_label =
    stream_metrics.avg_interval_ms != null
      ? `${stream_metrics.avg_interval_ms} ms`
      : "Not enough data";

  const updates_per_sec =
    stream_metrics.avg_interval_ms != null &&
    stream_metrics.avg_interval_ms > 0
      ? 1000 / stream_metrics.avg_interval_ms
      : null;

  const show_live_stream_warning =
    is_live && stream_metrics.total_updates === 0;

  return (
    <div className="min-h-screen bg-[#18181b] text-[#e4e7e7] font-sans">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-5 sm:py-7">
        {/* top bar */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-semibold text-slate-950 shadow-sm">
              SS
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Signal Studio
              </span>
              <span className="text-[11px] text-[#9ca3af]">
                Internal signal dashboard prototype
              </span>
            </div>
          </div>

          {/* mode toggle */}
          <div className="flex items-center gap-1 rounded-full border border-[#3a3b40] bg-[#18181b] px-1 py-1 text-[11px]">
            <button
              type="button"
              onClick={() => set_mode("mock")}
              className={[
                "px-2 py-0.5 rounded-full",
                !is_live ? "bg-sky-500 text-slate-950" : "text-[#9ca3af]"
              ].join(" ")}
            >
              Mock
            </button>
            <button
              type="button"
              onClick={() => set_mode("live")}
              className={[
                "px-2 py-0.5 rounded-full",
                is_live ? "bg-emerald-500 text-slate-950" : "text-[#9ca3af]"
              ].join(" ")}
            >
              Live
            </button>
          </div>
        </div>

        {/* layout with sidebar */}
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* sidebar desktop */}
          <aside className="hidden md:block w-44 pt-1">
            <nav className="space-y-1 text-sm">
              {nav_items.map((item) => {
                const is_active_item = item.id === nav_active;
                const is_alerts_item = item.id === "alerts";

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => set_nav_active(item.id)}
                    className={[
                      "w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition",
                      is_active_item
                        ? "bg-[#111827] text-[#e5e7eb]"
                        : "text-[#9ca3af] hover:bg-[#111827]/60 hover:text-[#e5e7eb]"
                    ].join(" ")}
                  >
                    <span>{item.label}</span>
                    {is_alerts_item && active_alert_count > 0 && (
                      <span className="text-[11px] rounded-full bg-rose-500/90 text-white px-2 py-0.5">
                        {active_alert_count}
                      </span>
                    )}
                    {item.id === "overview" && !is_alerts_item && (
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* main column */}
          <div className="flex-1">
            {/* mobile nav chips */}
            <div className="mb-4 flex md:hidden gap-2 overflow-x-auto pb-1">
              {nav_items.map((item) => {
                const is_active_item = item.id === nav_active;
                const is_alerts_item = item.id === "alerts";

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => set_nav_active(item.id)}
                    className={[
                      "px-3 py-1 rounded-full border text-xs whitespace-nowrap flex items-center gap-1.5",
                      is_active_item
                        ? "bg-[#111827] border-[#3b82f6] text-[#e5e7eb]"
                        : "bg-[#18181b] border-[#3a3b40] text-[#9ca3af]"
                    ].join(" ")}
                  >
                    <span>{item.label}</span>
                    {is_alerts_item && active_alert_count > 0 && (
                      <span className="text-[10px] rounded-full bg-rose-500/90 text-white px-1.5 py-0.5">
                        {active_alert_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* header */}
            <header className="mb-5 sm:mb-7 pb-4 border-b border-[#27272f]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#27272f] bg-[#111827] px-3 py-1 text-[11px] text-[#9ca3af]">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  <span className="uppercase tracking-[0.16em]">
                    Internal live signal view
                  </span>
                </div>
              </div>
            </header>


            {/* main surface */}
            <main className="rounded-2xl border border-[#27272f] bg-[#1f2126] shadow-lg shadow-black/40 p-4 sm:p-5 lg:px-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs text-[#9ca3af]">
                  {show_settings_view
                    ? "Settings"
                    : show_alerts_view
                    ? "Alerts"
                    : show_streams_view
                    ? "Streams"
                    : "Live signals"}
                </p>
                {show_alerts_view && (
                  <p className="text-[11px] text-[#9ca3af]">
                    {active_alert_count} active
                  </p>
                )}
              </div>

              {show_settings_view ? (
                /* SETTINGS VIEW */
                <div className="space-y-6 text-xs sm:text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af] mb-2">
                      Alert thresholds
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[#e5e7eb]">
                          Load alert starts at (%)
                        </label>
                        <input
                          type="number"
                          value={settings.alert_load_threshold}
                          onChange={(event) =>
                            set_settings((prev) => ({
                              ...prev,
                              alert_load_threshold:
                                Number(event.target.value) || 0
                            }))
                          }
                          className="w-full rounded border border-[#3a3b40] bg-[#18181b] px-2 py-1 text-xs text-[#e5e7eb]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[#e5e7eb]">
                          Latency alert starts at (ms)
                        </label>
                        <input
                          type="number"
                          value={settings.alert_latency_threshold}
                          onChange={(event) =>
                            set_settings((prev) => ({
                              ...prev,
                              alert_latency_threshold:
                                Number(event.target.value) || 0
                            }))
                          }
                          className="w-full rounded border border-[#3a3b40] bg-[#18181b] px-2 py-1 text-xs text-[#e5e7eb]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[#e5e7eb]">
                          Error alert starts at (%)
                        </label>
                        <input
                          type="number"
                          value={settings.alert_error_threshold}
                          onChange={(event) =>
                            set_settings((prev) => ({
                              ...prev,
                              alert_error_threshold:
                                Number(event.target.value) || 0
                            }))
                          }
                          className="w-full rounded border border-[#3a3b40] bg-[#18181b] px-2 py-1 text-xs text-[#e5e7eb]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af] mb-2">
                      Event spikes for timeline
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[#e5e7eb]">
                          Load spike at (%)
                        </label>
                        <input
                          type="number"
                          value={settings.spike_load_threshold}
                          onChange={(event) =>
                            set_settings((prev) => ({
                              ...prev,
                              spike_load_threshold:
                                Number(event.target.value) || 0
                            }))
                          }
                          className="w-full rounded border border-[#3a3b40] bg-[#18181b] px-2 py-1 text-xs text-[#e5e7eb]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[#e5e7eb]">
                          Latency spike at (ms)
                        </label>
                        <input
                          type="number"
                          value={settings.spike_latency_threshold}
                          onChange={(event) =>
                            set_settings((prev) => ({
                              ...prev,
                              spike_latency_threshold:
                                Number(event.target.value) || 0
                            }))
                          }
                          className="w-full rounded border border-[#3a3b40] bg-[#18181b] px-2 py-1 text-xs text-[#e5e7eb]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[#e5e7eb]">
                          Error spike at (%)
                        </label>
                        <input
                          type="number"
                          value={settings.spike_error_threshold}
                          onChange={(event) =>
                            set_settings((prev) => ({
                              ...prev,
                              spike_error_threshold:
                                Number(event.target.value) || 0
                            }))
                          }
                          className="w-full rounded border border-[#3a3b40] bg-[#18181b] px-2 py-1 text-xs text-[#e5e7eb]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : show_alerts_view ? (
                /* ALERTS VIEW */
                <div className="space-y-2 text-xs sm:text-sm">
                  {alerts.length === 0 && (
                    <p className="text-[#6b7280]">
                      No active alerts. All signals are inside thresholds.
                    </p>
                  )}

                  {alerts.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => set_selected_signal_id(alert.signal_id)}
                      className="w-full flex items-center justify-between rounded-lg border border-[#27272f] bg-[#18181b] px-3 py-2 text-left hover:border-[#38bdf8]/70 hover:bg-[#1e2028] transition"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "h-2 w-2 rounded-full",
                            alert.severity === "critical"
                              ? "bg-rose-400"
                              : "bg-amber-300"
                          ].join(" ")}
                        />
                        <div className="flex flex-col">
                          <span className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">
                            {alert.signal_label}
                          </span>
                          <span className="text-[#e5e7eb]">
                            {alert.message}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#9ca3af]">
                        {alert.kind}
                      </span>
                    </button>
                  ))}
                </div>
              ) : show_streams_view ? (
                /* STREAMS VIEW */
                <div className="space-y-4 text-xs sm:text-sm">
                  {show_live_stream_warning && (
                    <div className="rounded-xl border border-amber-500/70 bg-[#18181b] p-3 text-[11px] text-[#fbbf24]">
                      Not receiving live data yet. Make sure the WebSocket
                      server is running on{" "}
                      <span className="font-mono">ws://localhost:8080</span>.
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#27272f] bg-[#18181b] p-4 space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">
                        Update rate
                      </p>
                      <p className="text-lg font-semibold text-[#e5e7eb]">
                        {updates_per_sec != null
                          ? `${updates_per_sec.toFixed(2)} / s`
                          : "Collecting data"}
                      </p>
                      <p className="text-[11px] text-[#6b7280]">
                        {stream_metrics.updates_last_min} updates in the last
                        minute. Mode: {is_live ? "Live stream" : "Mock stream"}.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#27272f] bg-[#18181b] p-4 space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">
                        Timing
                      </p>
                      <p className="text-lg font-semibold text-[#e5e7eb]">
                        Avg interval {avg_interval_label}
                      </p>
                      <p className="text-[11px] text-[#6b7280]">
                        Last update at {last_update_label}. Total updates{" "}
                        {stream_metrics.total_updates}.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#27272f] bg-[#18181b] p-4 space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">
                      Update interval history
                    </p>
                    {stream_metrics.intervals_ms.length === 0 ? (
                      <p className="text-[11px] text-[#6b7280]">
                        Waiting for enough updates to plot intervals.
                      </p>
                    ) : (
                      <Sparkline_dots values={stream_metrics.intervals_ms} />
                    )}
                    <p className="text-[11px] text-[#6b7280]">
                      Each point shows time between successive updates in
                      milliseconds.
                    </p>
                  </div>
                </div>
              ) : (
                /* OVERVIEW VIEW */
                <>
                  {/* sorting and filtering */}
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9ca3af]">Sort by</span>
                      <select
                        value={sort_key}
                        onChange={(event) =>
                          set_sort_key(event.target.value as typeof sort_key)
                        }
                        className="bg-[#26272b] border border-[#3a3b40] rounded px-2 py-1 text-xs text-[#e4e7eb]"
                      >
                        <option value="none">Default</option>
                        <option value="load">Load</option>
                        <option value="latency">Latency</option>
                        <option value="error">Error rate</option>
                        <option value="status">Status</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9ca3af]">Filter</span>
                      <select
                        value={filter_state}
                        onChange={(event) =>
                          set_filter_state(
                            event.target.value as typeof filter_state
                          )
                        }
                        className="bg-[#26272b] border border-[#3a3b40] rounded px-2 py-1 text-xs text-[#e4e7eb]"
                      >
                        <option value="all">All</option>
                        <option value="healthy">Healthy</option>
                        <option value="degraded">Degraded</option>
                        <option value="down">Down</option>
                      </select>
                    </div>
                  </div>

                  {/* signal grid */}
                  <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {sorted_filtered.map((signal) => (
                      <Signal_card
                        key={signal.id}
                        signal={signal}
                        has_alert={alert_signal_ids.has(signal.id)}
                        on_click={() => set_selected_signal_id(signal.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {selected_signal && (
        <Signal_detail_modal
          signal={selected_signal}
          on_close={() => set_selected_signal_id(null)}
          events={event_history}
        />
      )}
    </div>
  );
}

export default App;
