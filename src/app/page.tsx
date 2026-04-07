import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const highlights = [
  {
    title: "Auto-sign once",
    detail: "Recurring DCA execution without reopening the wallet every day.",
  },
  {
    title: "Bridge in directly",
    detail: "Cross-chain capital flow enters DripFi through Interwoven.",
  },
  {
    title: "Track everything",
    detail: "Average entry, total invested, current value, and live PnL.",
  },
];

const marqueeItems = [
  "Initia Auto-signing",
  "Interwoven Bridge",
  "Strategy Dashboard",
  "Pause / Resume / Stop",
  "Wallet Connect",
  "0.3% Execution Fee",
  ".init Strategy Identity",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden text-[color:var(--ink)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animated-grid absolute inset-0 opacity-50" />
        <div className="mesh-glow mesh-glow-left absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full blur-3xl" />
        <div className="mesh-glow mesh-glow-right absolute right-[-6rem] top-16 h-[24rem] w-[24rem] rounded-full blur-3xl" />
        <div className="background-sweep absolute inset-0" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="reveal flex items-center justify-between rounded-full border border-white/8 bg-white/4 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="glow-ring flex h-10 w-10 items-center justify-center rounded-full bg-[var(--mint-soft)] font-mono text-sm font-semibold text-[var(--mint)]">
              DF
            </div>
            <div>
              <p className="font-display text-xl tracking-tight text-[var(--ink)]">DripFi</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Automated DCA on Initia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-[var(--line)] bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)] md:block">
              Simple one-screen landing
            </div>
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-medium text-slate-950 hover:-translate-y-0.5 hover:bg-[#e7e7e7]"
            >
              Open app
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-6 lg:grid-cols-[0.98fr_1.02fr] lg:py-10">
          <div className="reveal reveal-delay-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/4 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Set it, forget it, profit
            </div>

            <h1 className="mt-5 font-display text-5xl leading-[0.92] tracking-[-0.06em] text-[var(--ink)] sm:text-6xl lg:text-[5rem]">
              Clean automation for recurring crypto buys.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              DripFi is a hands-free DCA protocol for Initia. Users configure a strategy once,
              approve autosign once, bridge capital in, and let recurring execution happen in the
              background while the dashboard keeps performance visible.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <article key={item.title} className="panel-soft rounded-[1.5rem] p-4">
                  <p className="text-sm font-medium text-[var(--ink)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-[var(--mint)] px-5 py-3 text-sm font-medium text-slate-950 hover:-translate-y-0.5 hover:bg-[#e7e7e7]"
              >
                Launch dashboard
              </Link>
              <div className="rounded-full border border-[var(--line)] px-5 py-3 text-sm text-[var(--ink)]">
                0.3% execution fee
              </div>
            </div>
          </div>

          <div className="reveal reveal-delay-2 relative flex items-center justify-center lg:justify-end">
            <div className="landing-scene relative h-[34rem] w-full max-w-[40rem]">
              <div className="orbit-ring orbit-ring-one absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />
              <div className="orbit-ring orbit-ring-two absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />

              <div className="floating-badge floating-badge-left absolute left-10 top-[-1.25rem] z-30 rounded-full border border-white/8 bg-white/6 px-4 py-2 backdrop-blur">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Interwoven Bridge
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--ink)]">ETH / BSC / Cosmos</p>
              </div>

              <div className="floating-badge floating-badge-right absolute right-4 top-[-1.4rem] z-30 rounded-full border border-white/8 bg-white/6 px-4 py-2 backdrop-blur">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Session UX
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--ink)]">Autosign active</p>
              </div>

              <div className="floating-badge floating-badge-bottom absolute bottom-16 right-8 z-30 rounded-full border border-white/8 bg-white/6 px-4 py-2 backdrop-blur">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Dashboard
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--ink)]">PnL + average entry</p>
              </div>

              <div className="tilt-stage absolute left-1/2 top-1/2 z-10 w-full max-w-[32rem] -translate-x-1/2 -translate-y-1/2">
                <div className="tilt-card panel relative overflow-hidden rounded-[2rem] p-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_34%)]" />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.06))]" />

                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                        INIT Core Stack
                      </p>
                      <p className="mt-2 font-display text-3xl tracking-[-0.04em] text-[var(--ink)]">
                        $24 daily
                      </p>
                    </div>
                    <div className="rounded-full border border-[var(--line)] bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--mint)]">
                      Ready
                    </div>
                  </div>

                  <div className="relative mt-5 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                      <span className="font-mono">Strategy performance</span>
                      <span className="font-mono text-[var(--mint)]">+12.8%</span>
                    </div>

                    <svg viewBox="0 0 420 180" className="mt-4 h-44 w-full">
                      <defs>
                        <linearGradient id="heroLine" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8f8f8f" />
                          <stop offset="100%" stopColor="#f5f5f5" />
                        </linearGradient>
                        <linearGradient id="heroArea" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 150 L0 126 C28 120 44 126 70 112 C92 101 108 109 130 90 C155 70 185 76 209 84 C236 93 266 44 292 58 C315 70 344 36 369 45 C389 52 404 30 420 18 L420 180 L0 180 Z"
                        fill="url(#heroArea)"
                      />
                      <path
                        d="M0 126 C28 120 44 126 70 112 C92 101 108 109 130 90 C155 70 185 76 209 84 C236 93 266 44 292 58 C315 70 344 36 369 45 C389 52 404 30 420 18"
                        fill="none"
                        stroke="url(#heroLine)"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Average entry" value="0.418" />
                    <MiniStat label="Runs / month" value="30" />
                    <MiniStat label="Vault state" value="Autosign armed" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="reveal reveal-delay-3 overflow-hidden rounded-full border border-white/8 bg-white/4 py-3 backdrop-blur">
          <div className="marquee-track flex min-w-max items-center gap-4 px-4">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-center gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  {item}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/8 bg-white/4 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--ink)]">{value}</p>
    </div>
  );
}
