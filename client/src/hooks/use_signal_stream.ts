import { useEffect, useRef, useState } from "react";
import type { Signal } from "../types/signal";

export type Connection_status = "idle" | "connecting" | "connected" | "error";

interface Signal_batch_message {
  type: "signal_batch";
  signals: (Signal & { updated_at?: number })[];
}

export function use_signal_stream(url: string, enabled: boolean) {
  const [signals, set_signals] = useState<Signal[]>([]);
  const [connection_status, set_connection_status] =
    useState<Connection_status>("idle");
  const [last_tick_at, set_last_tick_at] = useState<number | null>(null);
  const ws_ref = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      // close if open
      if (ws_ref.current) {
        ws_ref.current.close();
        ws_ref.current = null;
      }
      set_connection_status("idle");
      return;
    }

    const ws = new WebSocket(url);
    ws_ref.current = ws;
    set_connection_status("connecting");

    ws.onopen = () => {
      set_connection_status("connected");
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as Signal_batch_message;

        if (parsed.type === "signal_batch") {
          const next_signals = parsed.signals.map(({ updated_at, ...rest }) => rest);
          set_signals(next_signals);
          set_last_tick_at(Date.now());
        }
      } catch (err) {
        console.error("signal_parse_fail", err);
      }
    };

    ws.onerror = () => {
      set_connection_status("error");
    };

    ws.onclose = () => {
      set_connection_status("idle");
    };

    return () => {
      ws.close();
    };
  }, [url, enabled]);

  return {
    signals,
    connection_status,
    last_tick_at
  };
}
