import { useEffect, useRef, useState } from "react";
import type { Signal } from "../types/signal";

export interface Stream_metrics {
  mode: "mock" | "live";
  last_update_at: number | null;
  intervals_ms: number[];
  avg_interval_ms: number | null;
  updates_last_min: number;
  total_updates: number;
}

export function use_stream_metrics(
  mode: "mock" | "live",
  signals: Signal[]
): Stream_metrics {
  const [intervals_ms, set_intervals_ms] = useState<number[]>([]);
  const [last_update_at, set_last_update_at] = useState<number | null>(null);
  const [total_updates, set_total_updates] = useState(0);
  const [recent_timestamps, set_recent_timestamps] = useState<number[]>([]);
  const prev_time_ref = useRef<number | null>(null);
  const has_booted_ref = useRef(false);

  useEffect(() => {
    if (!signals.length) return;

    const now = Date.now();

    if (!has_booted_ref.current) {
      has_booted_ref.current = true;
      prev_time_ref.current = now;
      set_last_update_at(now);
      set_total_updates(1);
      set_recent_timestamps([now]);
      return;
    }

    const prev_time = prev_time_ref.current;
    prev_time_ref.current = now;
    set_last_update_at(now);
    set_total_updates((prev) => prev + 1);

    if (prev_time != null) {
      const interval = now - prev_time;

      set_intervals_ms((prev) => {
        const next = [...prev, interval];
        const max_len = 32;
        if (next.length > max_len) {
          return next.slice(next.length - max_len);
        }
        return next;
      });
    }

    set_recent_timestamps((prev) => {
      const next = [...prev, now];
      const cutoff = now - 60_000;
      return next.filter((timestamp) => timestamp >= cutoff);
    });
  }, [signals]);

  const avg_interval_ms =
    intervals_ms.length === 0
      ? null
      : Math.round(
          intervals_ms.reduce((sum, value) => sum + value, 0) /
            intervals_ms.length
        );

  return {
    mode,
    last_update_at,
    intervals_ms,
    avg_interval_ms,
    updates_last_min: recent_timestamps.length,
    total_updates
  };
}
