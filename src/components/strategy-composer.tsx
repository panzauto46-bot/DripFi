"use client";

import {
  dripfiConfig,
  dripfiTokenOptions,
  getConfiguredToken,
  intervalLabels,
  strategyTemplates,
} from "@/lib/dripfi-config";
import { useDripfiActions } from "@/hooks/use-dripfi-actions";
import { useDripfiDemoState } from "@/hooks/use-dripfi-demo-state";
import { useDripfiRpcHealth } from "@/hooks/use-dripfi-rpc-health";

export function StrategyComposer() {
  const { draft, metrics, updateDraft, applyTemplate, isPending } =
    useDripfiDemoState();
  const {
    status,
    isPending: isActionPending,
    autoSignEnabled,
    createStrategyFromDraft,
    openRealBridge,
    hasLiveVault,
  } = useDripfiActions();
  const rpcHealth = useDripfiRpcHealth();
  const fundingToken = getConfiguredToken(draft.tokenIn);
  const targetToken = getConfiguredToken(draft.tokenOut);
  const bridgeMatchesFundingToken =
    dripfiConfig.bridge.assetSymbol.toUpperCase() === fundingToken.symbol.toUpperCase();
  const canCreateStrategy = hasLiveVault && rpcHealth.isReachable && !isPending && !isActionPending;

  return (
    <section className="panel rounded-[1.8rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Strategy Builder
          </p>
          <h2 className="mt-2 font-display text-[2rem] tracking-[-0.04em] text-[var(--ink)]">
            Compose a recurring DCA
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Pick a template, set size and cadence, then send one transaction.
          </p>
        </div>
        <div
          className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] ${
            autoSignEnabled
              ? "border-[var(--mint)] bg-[var(--mint-soft)] text-[var(--mint)]"
              : "border-[var(--line)] text-[var(--muted)]"
          }`}
        >
          {autoSignEnabled ? "Automation armed" : "Manual confirm"}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {strategyTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => applyTemplate(template.id)}
            className={`min-w-[9.5rem] flex-1 rounded-[1.2rem] border px-4 py-3 text-left ${
              draft.templateId === template.id
                ? "border-[var(--mint)] bg-white/8"
                : "border-white/8 bg-white/4"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--ink)]">{template.name}</p>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  draft.templateId === template.id ? "bg-[var(--mint)]" : "bg-white/15"
                }`}
              />
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--gold)]">
              {intervalLabels[template.interval]}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <TokenSelectCard
          label="Funding token"
          value={draft.tokenIn}
          onChange={(value) => updateDraft("tokenIn", value)}
        />
        <TokenSelectCard
          label="Target token"
          value={draft.tokenOut}
          onChange={(value) => updateDraft("tokenOut", value)}
        />
        <InputCard
          label="Amount per order"
          value={draft.amountPerOrder}
          suffix={fundingToken.symbol}
          onChange={(value) => updateDraft("amountPerOrder", value)}
        />
        <InputCard
          label="Strategy budget"
          value={draft.budget}
          suffix={fundingToken.symbol}
          onChange={(value) => updateDraft("budget", value)}
        />

        <div className="rounded-[1.4rem] border border-white/8 bg-white/4 p-4 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">
              Interval
            </p>
            <p className="text-xs text-[var(--muted)]">Recurring execution cadence</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["hourly", "daily", "weekly"] as const).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => updateDraft("interval", interval)}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  draft.interval === interval
                    ? "border-[var(--mint)] bg-white/10 text-[var(--mint)]"
                    : "border-white/10 text-[var(--muted)]"
                }`}
              >
                {intervalLabels[interval]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-[var(--line)] bg-black/15 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">
            Live preview
          </p>
          <span className="text-xs text-[var(--muted)]">
            {hasLiveVault
              ? rpcHealth.isReachable
                ? "On-chain ready"
                : rpcHealth.shortLabel
              : "Scaffold mode"}
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <PreviewRow label="Orders / month" value={String(metrics.runsPerMonth)} />
          <PreviewRow
            label="Monthly spend"
            value={`${metrics.projectedMonthlySpend.toFixed(0)} ${fundingToken.symbol}`}
          />
          <PreviewRow label="Runway" value={`${metrics.projectedRunway} orders`} />
          <PreviewRow
            label="Mode"
            value={
              hasLiveVault
                ? rpcHealth.isReachable
                  ? rpcHealth.isStablePublicEndpoint
                    ? "Ready for chain"
                    : "Temporary endpoint"
                  : "Endpoint offline"
                : "Local scaffold"
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              createStrategyFromDraft(draft, metrics.intervalInSeconds)
            }
            disabled={!canCreateStrategy}
            className="rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-medium text-slate-950 hover:-translate-y-0.5 hover:bg-[#e7e7e7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {!hasLiveVault
              ? "Needs live env"
              : isPending || isActionPending
                ? "Submitting..."
                : rpcHealth.isReachable
                  ? "Create + fund"
                  : "RPC offline"}
          </button>
          <button
            type="button"
            onClick={() => openRealBridge(draft.budget)}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--gold)] hover:text-[var(--gold)]"
          >
            {`Bridge ${dripfiConfig.bridge.assetSymbol}`}
          </button>
        </div>

        <p className="mt-3 text-xs leading-6 text-[var(--muted)]">{status}</p>
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
          Configured path: {fundingToken.symbol} into {targetToken.symbol}.
        </p>
        {hasLiveVault && !rpcHealth.isReachable ? (
          <p className="mt-1 text-xs leading-6 text-[var(--gold)]">{rpcHealth.detail}</p>
        ) : null}
        {hasLiveVault && rpcHealth.isReachable && !rpcHealth.isStablePublicEndpoint ? (
          <p className="mt-1 text-xs leading-6 text-[var(--gold)]">{rpcHealth.detail}</p>
        ) : null}
        {bridgeMatchesFundingToken ? (
          <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
            Bridge funding targets `{dripfiConfig.bridge.dstDenom}` for {fundingToken.symbol} top-ups.
          </p>
        ) : (
          <p className="mt-1 text-xs leading-6 text-[var(--gold)]">
            Bridge is currently configured for {dripfiConfig.bridge.assetSymbol}. Switch the funding
            token or fund {fundingToken.symbol} manually before creating the strategy.
          </p>
        )}
        {!hasLiveVault ? (
          <p className="mt-1 text-xs leading-6 text-[var(--gold)]">
            Live mode needs deployed addresses in `.env.local`.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function TokenSelectCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: (typeof dripfiTokenOptions)[number]["key"];
  onChange: (value: (typeof dripfiTokenOptions)[number]["key"]) => void;
}) {
  return (
    <label className="rounded-[1.4rem] border border-white/8 bg-white/4 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </p>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value as (typeof dripfiTokenOptions)[number]["key"])
        }
        className="mt-2 w-full bg-transparent text-base font-medium text-[var(--ink)] outline-none"
      >
        {dripfiTokenOptions.map((token) => (
          <option key={token.key} value={token.key}>
            {token.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputCard({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: string;
  suffix?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-[1.4rem] border border-white/8 bg-white/4 p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-base font-medium text-[var(--ink)] outline-none"
        />
        {suffix ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--gold)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-medium text-[var(--ink)]">{value}</span>
    </div>
  );
}
