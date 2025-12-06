import { WebSocketServer } from "ws";

type Signal_status = "healthy" | "degraded" | "down";

interface Signal_payload {
  id: string;
  label: string;
  status: Signal_status;
  load_pct: number;
  latency_ms: number;
  error_rate: number;
  updated_at: number;
}

interface Signal_batch_message {
  type: "signal_batch";
  signals: Signal_payload[];
}

const port = Number(process.env.PORT) || 8080;

const signal_ids = [
  "auth_service",
  "payments_pipeline",
  "cache_cluster",
  "search_indexer",
  "worker_pool",
  "queue_broker"
];

function random_status(prev: Signal_status): Signal_status {
  const roll = Math.random();

  // tiny bias toward healthy
  if (roll < 0.7) return "healthy";
  if (roll < 0.9) return "degraded";
  return "down";
}

function random_step(base: number, spread: number, min: number, max: number) {
  const delta = (Math.random() * spread) - spread / 2;
  const next = base + delta;
  return Math.min(max, Math.max(min, next));
}

// small in memory state
const signal_state: Record<string, Signal_payload> = {};

function init_signal_state() {
  signal_ids.forEach((id) => {
    signal_state[id] = {
      id,
      label: id,
      status: "healthy",
      load_pct: Math.round(30 + Math.random() * 40),
      latency_ms: Math.round(40 + Math.random() * 80),
      error_rate: Number((Math.random() * 0.5).toFixed(1)),
      updated_at: Date.now()
    };
  });
}

function step_signals() {
  Object.values(signal_state).forEach((signal) => {
    const next_status = random_status(signal.status);

    const next_load = next_status === "down"
      ? 0
      : random_step(signal.load_pct, 18, 5, 98);

    const next_latency = next_status === "down"
      ? 0
      : random_step(signal.latency_ms || 80, 40, 15, 320);

    const next_error = next_status === "down"
      ? 100
      : random_step(signal.error_rate, 1.4, 0, 6);

    signal.status = next_status;
    signal.load_pct = Math.round(next_load);
    signal.latency_ms = Math.round(next_latency);
    signal.error_rate = Number(next_error.toFixed(1));
    signal.updated_at = Date.now();
  });
}

function to_batch_message(): Signal_batch_message {
  return {
    type: "signal_batch",
    signals: Object.values(signal_state)
  };
}

function start_server() {
  init_signal_state();

  const wss = new WebSocketServer({ port });

  console.log(`signal_server listening on ws://localhost:${port}`);

  wss.on("connection", (socket) => {
    console.log("client_connected");

    // send snapshot on connect
    const snapshot_msg = JSON.stringify(to_batch_message());
    socket.send(snapshot_msg);

    socket.on("close", () => {
      console.log("client_disconnected");
    });
  });

  // broadcast loop
  setInterval(() => {
    step_signals();
    const msg = JSON.stringify(to_batch_message());

    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(msg);
      }
    });
  }, 1200); // about every 1.2 seconds
}

start_server();
