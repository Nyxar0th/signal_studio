export type Signal_status = "healthy" | "degraded" | "down";

export interface Signal {
  id: string;
  label: string;
  status: Signal_status;
  load_pct: number;
  latency_ms: number;
  error_rate: number;
}
