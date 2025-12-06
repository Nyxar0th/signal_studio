import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";
import type { Signal } from "../types/signal";
import { Sparkline_dots } from "./Sparkline_dots";

interface Signal_card_props {
  signal: Signal;
  on_click?: () => void;
  has_alert?: boolean;
}

// map status to styles
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

export function Signal_card({ signal, on_click, has_alert }: Signal_card_props) {
  const status_styles = get_status_styles(signal.status);

  const [load_display, set_load_display] = useState(signal.load_pct);
  const [latency_display, set_latency_display] = useState(signal.latency_ms);
  const [error_display, set_error_display] = useState(signal.error_rate);

  const [load_history, set_load_history] = useState<number[]>(() =>
    Array(12).fill(signal.load_pct)
  );

  // load anim
  useEffect(() => {
    const controls = animate(load_display, signal.load_pct, {
      type: "spring",
      stiffness: 200,
      damping: 20,
      onUpdate: (value) => set_load_display(Math.round(value))
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal.load_pct]);

  // latency anim
  useEffect(() => {
    const controls = animate(latency_display, signal.latency_ms, {
      type: "spring",
      stiffness: 200,
      damping: 20,
      onUpdate: (value) => set_latency_display(Math.round(value))
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal.latency_ms]);

  // error anim
  useEffect(() => {
    const controls = animate(error_display, signal.error_rate, {
      type: "spring",
      stiffness: 200,
      damping: 20,
      onUpdate: (value) =>
        set_error_display(Number(value.toFixed(1)))
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal.error_rate]);

  // history update
  useEffect(() => {
    set_load_history((prev) => {
      const next = [...prev, signal.load_pct];
      const max_len = 20;
      if (next.length > max_len) {
        return next.slice(next.length - max_len);
      }
      return next;
    });
  }, [signal.load_pct]);

  const latency_label =
    latency_display === 0 ? "Offline" : `${latency_display} ms`;

  const error_label =
    error_display >= 100 ? "100%" : `${error_display.toFixed(1)}%`;

  const load_width = Math.min(Math.max(signal.load_pct, 0), 100);

  const card_border_class = has_alert
    ? "border-rose-500/60"
    : "border-[#27272f]";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      onClick={on_click}
      className={[
        "rounded-xl bg-[#26272b] p-4 sm:p-5 shadow-sm flex flex-col gap-3 cursor-pointer",
        card_border_class,
        "hover:border-[#38bdf8]/70 hover:bg-[#272933] transition-colors"
      ].join(" ")}
    >
      {/* top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-[#9ca3af]">Live signal</p>
          <p className="text-base sm:text-lg font-semibold text-[#f9fafb] truncate">
            {signal.label}
          </p>
        </div>

        <motion.div
          layout
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium",
            "max-w-[130px]",
            status_styles.pill_class
          ].join(" ")}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status_styles.dot_class}`}
          />
          <span className="uppercase tracking-[0.14em] truncate">
            {status_styles.label}
          </span>
        </motion.div>
      </div>

      {/* middle metrics */}
      <div className="flex items-end justify-between gap-3 text-sm">
        <div className="space-y-1">
          <p className="text-[11px] text-[#9ca3af] uppercase tracking-[0.16em]">
            Load
          </p>

          <p className="text-xl font-semibold text-[#e5e7eb]">
            {load_display}
            <span className="text-xs text-[#9ca3af] ml-1">%</span>
          </p>
        </div>

        <div className="flex gap-6 text-xs sm:text-[13px]">
          <div className="space-y-1">
            <p className="text-[11px] text-[#9ca3af] uppercase tracking-[0.16em]">
              Latency
            </p>
            <p className="text-[#e5e7eb]">{latency_label}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] text-[#9ca3af] uppercase tracking-[0.16em]">
              Error rate
            </p>
            <p className="text-[#e5e7eb]">{error_label}</p>
          </div>
        </div>
      </div>

      {/* sparkline and load bar */}
      <div className="mt-1 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#6b7280]">
            Recent load trend
          </p>
          <Sparkline_dots values={load_history} />
        </div>

        <div className="h-1.5 w-full rounded-full bg-[#18181b] overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${load_width}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-300"
          />
        </div>
      </div>
    </motion.div>
  );
}
