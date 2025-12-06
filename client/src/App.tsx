import { Signal_card } from "./components/Signal_card";
import { use_random_signal_updates } from "./hooks/use_random_signal_updates";

function App() {
  // random updates for animation testing
  const signals = use_random_signal_updates();

  return (
    <div className="min-h-screen bg-[#18181b] text-[#e4e4e7] font-sans">
      {/* shell */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-5 sm:py-7">

        {/* top bar */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-semibold text-slate-950 shadow-sm">
              SS
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                signal_studio
              </span>
              <span className="text-[11px] text-[#9ca3af]">
                internal_signal_dashboard_proto
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline text-[#9ca3af]">
              env
            </span>
            <span className="rounded-full border border-[#3a3b40] bg-[#27272f] px-3 py-1 text-[11px] text-[#e5e7eb]">
              local_mock_stream
            </span>
          </div>
        </div>

        {/* header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5 sm:mb-6">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f9fafb]">
              A tiny control room for live_signals
            </h1>
            <p className="text-sm text-[#9ca3af] max-w-xl">
              Watch small system_state changes as motion and color instead of plain logs.
              Built to keep noise low and highlight patterns.
            </p>
          </div>

          {/* connection placeholder */}
          <div className="mt-1 sm:mt-0 flex flex-col items-start sm:items-end gap-1">
            <span className="text-xs text-[#9ca3af]">
              connection_status
            </span>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#3a3b40] bg-[#18181b] px-3 py-1 text-xs shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[#e4e4e7]">
                waiting_for_stream
              </span>
            </div>

            <span className="text-[11px] text-[#6b7280]">
              websocket_not_hooked_yet
            </span>
          </div>
        </header>

        {/* dashboard surface */}
        <main className="rounded-2xl border border-[#27272f] bg-[#1f2126] shadow-lg shadow-black/40 p-4 sm:p-5 lg:p-6">

          {/* header bar inside surface */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[#9ca3af]">
              live_signals_preview
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span>mock_data_only_for_now</span>
            </div>
          </div>

          {/* signal grid */}
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {signals.map((signal) => (
              <Signal_card key={signal.id} signal={signal} />
            ))}
          </div>

          <p className="mt-5 text-[11px] text-[#6b7280]">
            dev_hint: next_step_is_websocket_stream_and_motion
          </p>
        </main>
      </div>
    </div>
  );
}

export default App;
