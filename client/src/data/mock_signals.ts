import type { Signal } from "../types/signal";

export const mock_signals: Signal[] = [
  {
    id: "auth_service",
    label: "auth_service",
    status: "healthy",
    load_pct: 41,
    latency_ms: 82,
    error_rate: 0.2
  },
  {
    id: "payments_pipeline",
    label: "payments_pipeline",
    status: "degraded",
    load_pct: 73,
    latency_ms: 145,
    error_rate: 1.4
  },
  {
    id: "cache_cluster",
    label: "cache_cluster",
    status: "healthy",
    load_pct: 58,
    latency_ms: 19,
    error_rate: 0.1
  },
  {
    id: "search_indexer",
    label: "search_indexer",
    status: "degraded",
    load_pct: 64,
    latency_ms: 192,
    error_rate: 0.8
  },
  {
    id: "worker_pool",
    label: "worker_pool",
    status: "healthy",
    load_pct: 35,
    latency_ms: 43,
    error_rate: 0.0
  },
  {
    id: "queue_broker",
    label: "queue_broker",
    status: "down",
    load_pct: 0,
    latency_ms: 0,
    error_rate: 100
  }
];
