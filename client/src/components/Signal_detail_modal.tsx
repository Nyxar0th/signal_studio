import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Signal } from "../types/signal";
import type { Signal_event } from "../hooks/use_event_history";

interface Signal_detail_modal_props {
  signal: Signal;
  events: Signal_event[];
  on_close: () => void;
}

const PAGE_SIZE = 10;

export function Signal_detail_modal({
  signal,
  events,
  on_close
}: Signal_detail_modal_props) {
  const [page_index, set_page_index] = useState(0);

  // reset to first page when signal changes
  useEffect(() => {
    set_page_index(0);
  }, [signal.id]);

  const signal_events = events
    .filter((event) => event.signal_id === signal.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const total_events = signal_events.length;
  const total_pages =
    total_events === 0 ? 1 : Math.ceil(total_events / PAGE_SIZE);

  const clamped_page_index = Math.min(page_index, total_pages - 1);
  const start_index = clamped_page_index * PAGE_SIZE;
  const end_index = start_index + PAGE_SIZE;

  const page_events = signal_events.slice(start_index, end_index);

  const can_go_prev = clamped_page_index > 0;
  const can_go_next = clamped_page_index < total_pages - 1;

  const handle_prev = () => {
    if (!can_go_prev) return;
    set_page_index((prev) => Math.max(prev - 1, 0));
  };

  const handle_next = () => {
    if (!can_go_next) return;
    set_page_index((prev) => Math.min(prev + 1, total_pages - 1));
  };

  const range_start = total_events === 0 ? 0 : start_index + 1;
  const range_end = Math.min(end_index, total_events);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={on_close}
      >
        <motion.div
          className="relative w-full max-w-xl rounded-2xl border border-[#27272f] bg-[#111827] p-4 sm:p-5 shadow-xl shadow-black/50"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          onClick={(event) => event.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af] mb-1">
                Live signal
              </p>
              <h2 className="text-lg font-semibold text-[#f9fafb]">
                {signal.label}
              </h2>
              <p className="text-xs text-[#9ca3af] mt-1">
                Status {signal.status} · Load {signal.load_pct}% · Latency{" "}
                {signal.latency_ms} ms · Error{" "}
                {signal.error_rate.toFixed(1)}%
              </p>
            </div>
            <button
              type="button"
              onClick={on_close}
              className="rounded-full border border-[#374151] bg-[#111827] px-2 py-1 text-[11px] text-[#9ca3af] hover:bg-[#1f2937]"
            >
              Close
            </button>
          </div>

          {/* event list header */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#9ca3af]">
              Recent events
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]">
              <span>
                {total_events === 0
                  ? "No events yet"
                  : `Showing ${range_start}–${range_end} of ${total_events}`}
              </span>
              {total_events > PAGE_SIZE && (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handle_prev}
                    disabled={!can_go_prev}
                    className={[
                      "rounded-full border px-2 py-0.5",
                      can_go_prev
                        ? "border-[#374151] text-[#e5e7eb] hover:bg-[#1f2937]"
                        : "border-[#27272f] text-[#4b5563] cursor-not-allowed"
                    ].join(" ")}
                  >
                    Prev 10
                  </button>
                  <button
                    type="button"
                    onClick={handle_next}
                    disabled={!can_go_next}
                    className={[
                      "rounded-full border px-2 py-0.5",
                      can_go_next
                        ? "border-[#374151] text-[#e5e7eb] hover:bg-[#1f2937]"
                        : "border-[#27272f] text-[#4b5563] cursor-not-allowed"
                    ].join(" ")}
                  >
                    Next 10
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* event list */}
          <div className="max-h-72 overflow-y-auto rounded-xl border border-[#1f2933] bg-[#0b1120]">
            {page_events.length === 0 ? (
              <div className="px-3 py-6 text-center text-[11px] text-[#6b7280]">
                No timeline activity recorded for this signal yet.
              </div>
            ) : (
              <ul className="divide-y divide-[#111827] text-xs">
                {page_events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "h-2 w-2 rounded-full",
                          event.type === "status_change"
                            ? "bg-sky-400"
                            : event.type === "spike_error"
                            ? "bg-rose-400"
                            : event.type === "spike_latency"
                            ? "bg-amber-300"
                            : "bg-emerald-300"
                        ].join(" ")}
                      />
                      <div className="flex flex-col">
                        <span className="text-[#e5e7eb]">
                          {event.note}
                        </span>
                        <span className="text-[10px] text-[#6b7280]">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#6b7280]">
                      {event.type.replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
