"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StrategyComposer } from "@/components/strategy-composer";
import { WalletPanel } from "@/components/wallet-panel";
import { useDripfiLiveState } from "@/hooks/use-dripfi-live-state";
import { useDripfiActions } from "@/hooks/use-dripfi-actions";
import { dripfiConfig } from "@/lib/dripfi-config";

export default function DashboardPage() {
  const {
    identity,
    strategies,
    activityFeed,
    hasLiveContracts,
    isLoadingStrategies,
  } = useDripfiLiveState();
  const { isPending, runStrategyAction, status, autoSignEnabled } = useDripfiActions();

  useEffect(() => {
    if (!autoSignEnabled || !hasLiveContracts || isPending) return;

    const interval = window.setInterval(() => {
      const dueStrategy = strategies.find(
        (strategy) => strategy.statusTone === "running" && strategy.canExecute,
      );
      if (!dueStrategy) return;
      if (document.visibilityState !== "visible") return;

      void runStrategyAction(dueStrategy.id, "executeOrder");
    }, dripfiConfig.submission.autoExecutionPollMs);

    return () => window.clearInterval(interval);
  }, [autoSignEnabled, hasLiveContracts, isPending, runStrategyAction, strategies]);

  return (
    <main className="relative min-h-screen overflow-hidden text-[color:var(--ink)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-wash absolute inset-x-0 top-0 h-[32rem]" />
        <div className="absolute left-[-4rem] top-36 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-3rem] top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(180,180,180,0.1),transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-[1180px] flex-col px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <header className="reveal flex flex-col gap-4 rounded-[1.8rem] border border-white/8 bg-white/4 px-5 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="glow-ring flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mint-soft)] font-mono text-sm font-semibold text-[var(--mint)]">
              DF
            </div>
            <div>
              <p className="font-display text-2xl tracking-tight text-[var(--ink)]">DripFi Dashboard</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                {identity}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-full border border-white/12 px-4 py-2 text-center text-sm text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              Back to landing
            </Link>
            <a
              href="#strategy-builder"
              className="rounded-full bg-[var(--mint)] px-5 py-2.5 text-sm font-medium text-slate-950 hover:-translate-y-0.5 hover:bg-[#e7e7e7]"
            >
              Create new strategy
            </a>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill label={hasLiveContracts ? "Live contracts configured" : "Env addresses still missing"} tone={hasLiveContracts ? "positive" : "warning"} />
          <StatusPill label={autoSignEnabled ? "Autosign active" : "Autosign not active"} tone={autoSignEnabled ? "positive" : "neutral"} />
          {isLoadingStrategies ? <StatusPill label="Syncing strategy state" tone="neutral" /> : null}
          {status !== "Ready." ? <StatusPill label={status} tone="neutral" /> : null}
        </div>

        <div className="mt-8 space-y-6">
          <section className="panel reveal reveal-delay-1 rounded-[1.8rem] p-6 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Portfolio Snapshot
                </p>
                <h1 className="mt-2 font-display text-[2.6rem] tracking-[-0.05em] text-[var(--ink)] sm:text-[3.25rem]">
                  Automation that actually stays visible.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                  Review strategy state, trigger actions, confirm bridge access, and keep recurring execution under one live dashboard.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniMetric label="Profile" value={identity} />
                  <MiniMetric label="Strategies live" value={String(strategies.length)} />
                  <MiniMetric
                    label="Execution mode"
                    value={autoSignEnabled ? "Autosign" : "Manual"}
                  />
                  <MiniMetric
                    label="Vault mode"
                    value={hasLiveContracts ? "Connected" : "Scaffold"}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#090909] px-4 py-4">
                <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  <span className="font-mono">Value curve</span>
                  <span className="font-mono text-[var(--mint)]">Live sync</span>
                </div>
                <svg viewBox="0 0 600 220" className="h-52 w-full">
                  <defs>
                    <linearGradient id="dashboardLineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8f8f8f" />
                      <stop offset="100%" stopColor="#f5f5f5" />
                    </linearGradient>
                    <linearGradient id="dashboardAreaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 190 L0 160 C42 148 66 154 95 140 C126 125 148 138 182 110 C210 87 246 91 276 100 C310 109 348 58 383 76 C414 92 458 50 489 62 C520 72 546 36 600 26 L600 220 L0 220 Z"
                    fill="url(#dashboardAreaGlow)"
                  />
                  <path
                    d="M0 160 C42 148 66 154 95 140 C126 125 148 138 182 110 C210 87 246 91 276 100 C310 109 348 58 383 76 C414 92 458 50 489 62 C520 72 546 36 600 26"
                    fill="none"
                    stroke="url(#dashboardLineGlow)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {[
                    [95, 140],
                    [182, 110],
                    [276, 100],
                    [383, 76],
                    [489, 62],
                    [600, 26],
                  ].map(([x, y]) => (
                    <circle
                      key={`${x}-${y}`}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#061015"
                      stroke="#f5f5f5"
                      strokeWidth="3"
                    />
                  ))}
                </svg>
              </div>
            </div>
          </section>

          <div id="strategy-builder">
            <StrategyComposer />
          </div>

          <WalletPanel compact title="Wallet Access" />

          <section className="panel reveal reveal-delay-2 rounded-[1.8rem] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Active Strategies
                </p>
                <h2 className="mt-2 font-display text-[2rem] tracking-[-0.04em] text-[var(--ink)]">
                  Your vaults at a glance
                </h2>
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--mint)]">
                {strategies.length} tracked
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {strategies.map((strategy) => (
                <div key={strategy.name} className="rounded-[1.4rem] border border-white/8 bg-white/4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-2xl font-medium tracking-[-0.03em] text-[var(--ink)]">
                        {strategy.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{strategy.progress}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] ${
                        strategy.statusTone === "running"
                          ? "bg-[var(--mint-soft)] text-[var(--mint)]"
                          : strategy.statusTone === "paused"
                            ? "bg-[var(--gold-soft)] text-[var(--gold)]"
                            : "bg-white/8 text-[var(--muted)]"
                      }`}
                    >
                      {strategy.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Cadence" value={strategy.cadence} />
                    <MiniMetric label="Order size" value={strategy.amount} />
                    <MiniMetric label="Capital left" value={strategy.availableBalanceLabel} />
                    <MiniMetric label="Next execution" value={strategy.nextExecutionLabel} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {strategy.statusTone !== "completed" && strategy.statusTone !== "stopped" ? (
                      <button
                        onClick={() => runStrategyAction(strategy.id, "executeOrder")}
                        disabled={!strategy.canExecute || isPending}
                        className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--mint)] hover:text-[var(--mint)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Execute now
                      </button>
                    ) : null}
                    {strategy.statusTone === "paused" ? (
                      <button
                        onClick={() => runStrategyAction(strategy.id, "resumeStrategy")}
                        disabled={isPending}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[var(--muted)] hover:-translate-y-0.5 hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Resume
                      </button>
                    ) : strategy.statusTone === "running" ? (
                      <button
                        onClick={() => runStrategyAction(strategy.id, "pauseStrategy")}
                        disabled={isPending}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[var(--muted)] hover:-translate-y-0.5 hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Pause
                      </button>
                    ) : null}
                    {strategy.statusTone !== "completed" ? (
                      <button
                        onClick={() => runStrategyAction(strategy.id, "cancelStrategy")}
                        disabled={isPending}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[var(--muted)] hover:-translate-y-0.5 hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Stop
                      </button>
                    ) : null}
                    {strategy.availableBalance > 0n && strategy.statusTone !== "running" ? (
                      <button
                        onClick={() => runStrategyAction(strategy.id, "withdrawFunds")}
                        disabled={isPending}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-[var(--muted)] hover:-translate-y-0.5 hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Withdraw
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel reveal reveal-delay-3 rounded-[1.8rem] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                  Autopilot Feed
                </p>
                <h2 className="mt-2 font-display text-[2rem] tracking-[-0.04em] text-[var(--ink)]">
                  Recent activity
                </h2>
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--mint)]">
                4 fresh events
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {activityFeed.map((item) => (
                <div
                  key={`${item.time}-${item.action}`}
                  className="rounded-[1.4rem] border border-white/8 bg-white/4 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-[var(--ink)]">{item.action}</p>
                    <span className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-base font-medium text-[var(--ink)]">{value}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "positive" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "border-[var(--mint)] bg-[var(--mint-soft)] text-[var(--mint)]"
      : tone === "warning"
        ? "border-[var(--gold)] bg-[var(--gold-soft)] text-[var(--gold)]"
        : "border-white/10 bg-white/4 text-[var(--muted)]";

  return (
    <div className={`rounded-full border px-3 py-1.5 text-xs ${toneClass}`}>
      {label}
    </div>
  );
}
