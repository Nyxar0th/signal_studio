import { useEffect, useRef, useState } from "react";
import type { Signal } from "../types/signal";

export interface Signal_event {
  id: string;
  signal_id: string;
  label: string;
  timestamp: number;
  type: "status_change" | "spike_load" | "spike_latency" | "spike_error";
  note: string;
}

export interface Event_thresholds {
  spike_load_threshold: number;
  spike_latency_threshold: number;
  spike_error_threshold: number;
}

const MAX_EVENTS = 200;

export function use_event_history(
  signals: Signal[],
  thresholds: Event_thresholds
) {
  const [events, set_events] = useState<Signal_event[]>([]);
  const prev_ref = useRef<Record<string, Signal> | null>(null);

  const push_event = (event: Signal_event) => {
    set_events((old) => {
      const next = [event, ...old];
      if (next.length > MAX_EVENTS) {
        return next.slice(0, MAX_EVENTS);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!signals.length) return;

    const prev_map = prev_ref.current;
    const next_map: Record<string, Signal> = {};
    const now = Date.now();

    signals.forEach((signal) => {
      next_map[signal.id] = signal;

      const prev = prev_map?.[signal.id];
      if (!prev) return;

      // status change
      if (prev.status !== signal.status) {
        push_event({
          id: crypto.randomUUID(),
          signal_id: signal.id,
          label: signal.label,
          timestamp: now,
          type: "status_change",
          note: `${prev.status} → ${signal.status}`
        });
      }

      // load spike
      if (
        signal.load_pct >= thresholds.spike_load_threshold &&
        prev.load_pct < thresholds.spike_load_threshold
      ) {
        push_event({
          id: crypto.randomUUID(),
          signal_id: signal.id,
          label: signal.label,
          timestamp: now,
          type: "spike_load",
          note: `Load spiked to ${signal.load_pct}%`
        });
      }

      // latency spike
      if (
        signal.latency_ms >= thresholds.spike_latency_threshold &&
        prev.latency_ms < thresholds.spike_latency_threshold
      ) {
        push_event({
          id: crypto.randomUUID(),
          signal_id: signal.id,
          label: signal.label,
          timestamp: now,
          type: "spike_latency",
          note: `Latency reached ${signal.latency_ms} ms`
        });
      }

      // error spike
      if (
        signal.error_rate >= thresholds.spike_error_threshold &&
        prev.error_rate < thresholds.spike_error_threshold
      ) {
        push_event({
          id: crypto.randomUUID(),
          signal_id: signal.id,
          label: signal.label,
          timestamp: now,
          type: "spike_error",
          note: `Error spike: ${signal.error_rate.toFixed(1)}%`
        });
      }
    });

    prev_ref.current = next_map;
  }, [
    signals,
    thresholds.spike_load_threshold,
    thresholds.spike_latency_threshold,
    thresholds.spike_error_threshold
  ]);

  // return full history (we page it in the UI)
  return events;
}
