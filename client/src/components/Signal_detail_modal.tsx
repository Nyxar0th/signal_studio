import { motion } from "framer-motion";
import type { Signal } from "../types/signal";
import { Sparkline_dots } from "./Sparkline_dots";
import type { Signal_event } from "../hooks/use_event_history";

interface Signal_detail_modal_props {
  signal: Signal;
  on_close: () => void;
  events: Signal_event[];
}

function get_status_styles(status: Signal["status"]) {
  if (status === "healthy") {
    return {
      label: "Healthy",
      dot_class: "bg-emerald-400",
      pill_class: "border-emerald-500/60 text-emerald-200/90 bg-emerald-500/10"
    };
  }
  if (status === "degraded") {
    return {
      label: "Degraded",
      dot_class: "bg-amber-400",
      pill_class: "border-amber-400/70 text-amber-100/90 bg-amber-500/10"
    };
  }
  return {
    label: "Down",
    dot_class: "bg-rose-400",
    pill_class: "border-rose-500/70 text-rose-100/90 bg-rose-500/10"
  };
}

export function Signal_detail_modal({
  signal,
  on_close,
  events
}: Signal_detail_modal_props) {
  const status_styles = get_status_styles(signal.status);

  const events_for_signal = events.filter((e) => e.signal_id === signal.id);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center px-3"
      onClick={on_close}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-[#27272f] bg-[#111827] p-5 shadow-xl"
      >
        {/* header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-[#9ca3af]">Signal detail</p>
            <h2 className="text-xl font-semibold text-[#f9fafb]">
              {signal.label}
            </h2>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]",
                status_styles.pill_class
              ].join(" ")}
            >
              <span
                className={`h-2 w-2 rounded-full ${status_styles.dot_class}`}
              />
              {status_styles.label}
            </div>

            <button
              className="text-[11px] text-[#9ca3af] hover:text-white"
              onClick={on_close}
            >
              Close
            </button>
          </div>
        </div>

        {/* metrics */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {/* load */}
          <div className="rounded-lg border border-[#27272f] bg-[#1f2933] p-4 space-y-2">
            <div className="flex justify-between text-xs text-[#9ca3af]">
              <span>Load</span>
              <span className="text-white">{signal.load_pct}%</span>
            </div>
            <Sparkline_dots values={[...Array(20)].map(() => signal.load_pct)} />
          </div>

          {/* latency */}
          <div className="rounded-lg border border-[#27272f] bg-[#1f2933] p-4 space-y-2">
            <div className="flex justify-between text-xs text-[#9ca3af]">
              <span>Latency</span>
              <span className="text-white">
                {signal.latency_ms === 0 ? "Offline" : `${signal.latency_ms} ms`}
              </span>
            </div>
            <Sparkline_dots values={[...Array(20)].map(() => signal.latency_ms)} />
          </div>

          {/* error */}
          <div className="rounded-lg border border-[#27272f] bg-[#1f2933] p-4 space-y-2">
            <div className="flex justify-between text-xs text-[#9ca3af]">
              <span>Error rate</span>
              <span className="text-white">
                {signal.error_rate >= 100
                  ? "100%"
                  : `${signal.error_rate.toFixed(1)}%`}
              </span>
            </div>
            <Sparkline_dots values={[...Array(20)].map(() => signal.error_rate)} />
          </div>
        </div>

        {/* timeline */}
        <div>
          <p className="text-xs tracking-[0.16em] uppercase text-[#9ca3af] mb-2">
            Recent events
          </p>

          {events_for_signal.length === 0 && (
            <p className="text-[11px] text-[#6b7280]">
              No recent events for this signal.
            </p>
          )}

          <div className="space-y-2">
            {events_for_signal.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-[#27272f] bg-[#18181b] px-3 py-2"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      event.type === "status_change"
                        ? "h-2 w-2 rounded-full bg-sky-400"
                        : event.type === "spike_load"
                        ? "h-2 w-2 rounded-full bg-amber-400"
                        : event.type === "spike_latency"
                        ? "h-2 w-2 rounded-full bg-purple-400"
                        : "h-2 w-2 rounded-full bg-rose-400"
                    }
                  />
                  <span className="text-white">{event.note}</span>
                </div>

                <span className="text-[10px] text-[#6b7280]">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
