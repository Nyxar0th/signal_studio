import { motion } from "framer-motion";
import type { Signal } from "../types/signal";

interface Signal_card_props {
  signal: Signal;
}

function get_status_styles(status: Signal["status"]) {
  // tiny map
  if (status === "healthy") {
    return {
      label: "healthy",
      dot_class: "bg-emerald-400",
      pill_class: "border-emerald-500/60 text-emerald-200/90 bg-emerald-500/10"
    };
  }

  if (status === "degraded") {
    return {
      label: "degraded",
      dot_class: "bg-amber-400",
      pill_class: "border-amber-400/70 text-amber-100/90 bg-amber-500/10"
    };
  }

  return {
    label: "down",
    dot_class: "bg-rose-400",
    pill_class: "border-rose-500/70 text-rose-100/90 bg-rose-500/10"
  };
}

export function Signal_card({ signal }: Signal_card_props) {
  const status_styles = get_status_styles(signal.status);

  const load_width = Math.min(Math.max(signal.load_pct, 0), 100);

  // quick derived text
  const latency_label =
    signal.latency_ms === 0 ? "offline" : `${signal.latency_ms} ms`;

  const error_label =
    signal.error_rate >= 100 ? "100%" : `${signal.error_rate.toFixed(1)}%`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 220, damping: 22, mass: 0.9 }}
      className="rounded-xl border border-[#27272f] bg-[#26272b] p-4 sm:p-5 shadow-sm flex flex-col gap-3"
    >
      {/* top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-[#9ca3af]">
            live_signal
          </p>
          <p className="text-base sm:text-lg font-semibold text-[#f9fafb]">
            {signal.label}
          </p>
        </div>

        <motion.div
          layout
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            status_styles.pill_class
          ].join(" ")}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status_styles.dot_class}`}
          />
          <span className="uppercase tracking-[0.14em]">
            {status_styles.label}
          </span>
        </motion.div>
      </div>

      {/* middle metrics */}
      <div className="flex items-end justify-between gap-3 text-sm">
        <div className="space-y-1">
          <p className="text-[11px] text-[#9ca3af] uppercase tracking-[0.16em]">
            load_pct
          </p>
          <motion.p
            layout
            className="text-xl font-semibold text-[#e5e7eb]"
          >
            {signal.load_pct}
            <span className="text-xs text-[#9ca3af] ml-1">
              %
            </span>
          </motion.p>
        </div>

        <div className="flex gap-6 text-xs sm:text-[13px]">
          <div className="space-y-1">
            <p className="text-[11px] text-[#9ca3af] uppercase tracking-[0.16em]">
              latency
            </p>
            <motion.p layout className="text-[#e5e7eb]">
              {latency_label}
            </motion.p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-[#9ca3af] uppercase tracking-[0.16em]">
              error_rate
            </p>
            <motion.p layout className="text-[#e5e7eb]">
              {error_label}
            </motion.p>
          </div>
        </div>
      </div>

      {/* load bar */}
      <div className="mt-1 space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-[#18181b] overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${load_width}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-300"
          />
        </div>
        <p className="text-[11px] text-[#6b7280]">
          load_bar_preview_only_for_now
        </p>
      </div>
    </motion.div>
  );
}
