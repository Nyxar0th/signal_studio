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

export function use_event_history(
  signals: Signal[],
  thresholds: Event_thresholds
) {
  const [events, set_events] = useState<Signal_event[]>([]);
  const prev_ref = useRef<Record<string, Signal> | null>(null);

  useEffect(() => {
    if (!signals.length) return;

    const prev_map = prev_ref.current;
    const next_map: Record<string, Signal> = {};

    signals.forEach((signal) => {
      next_map[signal.id] = signal;

      const prev = prev_map?.[signal.id];
      if (!prev) return;

      // status change
      if (prev.status !== signal.status) {
        set_events((old) => [
          {
            id: crypto.randomUUID(),
            signal_id: signal.id,
            label: signal.label,
            timestamp: Date.now(),
            type: "status_change",
            note: `${prev.status} → ${signal.status}`
          },
          ...old
        ]);
      }

      // load spike
      if (
        signal.load_pct >= thresholds.spike_load_threshold &&
        prev.load_pct < thresholds.spike_load_threshold
      ) {
        set_events((old) => [
          {
            id: crypto.randomUUID(),
            signal_id: signal.id,
            label: signal.label,
            timestamp: Date.now(),
            type: "spike_load",
            note: `Load spiked to ${signal.load_pct}%`
          },
          ...old
        ]);
      }

      // latency spike
      if (
        signal.latency_ms >= thresholds.spike_latency_threshold &&
        prev.latency_ms < thresholds.spike_latency_threshold
      ) {
        set_events((old) => [
          {
            id: crypto.randomUUID(),
            signal_id: signal.id,
            label: signal.label,
            timestamp: Date.now(),
            type: "spike_latency",
            note: `Latency reached ${signal.latency_ms} ms`
          },
          ...old
        ]);
      }

      // error spike
      if (
        signal.error_rate >= thresholds.spike_error_threshold &&
        prev.error_rate < thresholds.spike_error_threshold
      ) {
        set_events((old) => [
          {
            id: crypto.randomUUID(),
            signal_id: signal.id,
            label: signal.label,
            timestamp: Date.now(),
            type: "spike_error",
            note: `Error spike: ${signal.error_rate.toFixed(1)}%`
          },
          ...old
        ]);
      }
    });

    prev_ref.current = next_map;
  }, [signals, thresholds.spike_load_threshold, thresholds.spike_latency_threshold, thresholds.spike_error_threshold]);

  return events;
}
