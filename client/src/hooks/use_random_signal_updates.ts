import { useEffect, useState } from "react";
import type { Signal } from "../types/signal";
import { mock_signals } from "../data/mock_signals";

export function use_random_signal_updates() {
  const [signals, set_signals] = useState<Signal[]>(mock_signals);

  useEffect(() => {
    // update loop
    const interval_id = setInterval(() => {
      set_signals((prev) =>
        prev.map((s) => {
          // small random variance
          const load = Math.max(0, Math.min(100, s.load_pct + (Math.random() * 20 - 10)));
          const latency = s.status === "down"
            ? 0
            : Math.max(10, Math.min(300, s.latency_ms + (Math.random() * 40 - 20)));
          const error = s.status === "down"
            ? 100
            : Math.max(0, Math.min(5, s.error_rate + (Math.random() * 1 - 0.5)));

          // maybe flip status a bit
          let status = s.status;
          const flip_chance = Math.random();

          if (flip_chance < 0.01) status = "down";           // 1 percent chance
          else if (flip_chance < 0.04) status = "degraded";  // low chance
          else if (flip_chance < 0.1) status = "healthy";    // return to normal

          return {
            ...s,
            load_pct: Math.round(load),
            latency_ms: Math.round(latency),
            error_rate: Number(error.toFixed(1)),
            status
          };
        })
      );
    }, 1500); // fires every 1.5s

    return () => clearInterval(interval_id);
  }, []);

  return signals;
}
