"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { dripfiConfig, isConfiguredAddress } from "@/lib/dripfi-config";
import { useDripfiActions } from "@/hooks/use-dripfi-actions";
import { useDripfiRpcHealth } from "@/hooks/use-dripfi-rpc-health";

type WalletPanelProps = {
  title?: string;
  compact?: boolean;
};

type InterwovenKitShape = {
  initiaAddress?: string;
  username?: string | null;
  openConnect: () => void;
  openWallet: () => void;
};

function shortenAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function formatUsername(username?: string | null) {
  if (!username) return "Not set";
  return username.endsWith(".init") ? username : `${username}.init`;
}

export function WalletPanel({
  title = "Wallet & bridge",
  compact = false,
}: WalletPanelProps) {
  const { initiaAddress, username, openConnect, openWallet } =
    useInterwovenKit() as InterwovenKitShape;
  const {
    status,
    isPending,
    autoSignEnabled,
    autoSignGrantee,
    automationRelayerConfigured,
    openRealBridge,
    enableAutosign,
    disableAutosign,
  } = useDripfiActions();
  const rpcHealth = useDripfiRpcHealth();

  const isConnected = Boolean(initiaAddress);

  return (
    <section className="panel-soft rounded-[1.8rem] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {compact
              ? "One place for identity, autosign, bridge, and chain status."
              : "Wallet connect, bridge entry, username identity, and automation controls for live MiniEVM strategy actions."}
          </p>
        </div>
        <div className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--mint)]">
          {isConnected ? "Connected" : "Awaiting wallet"}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <StatRow label="Profile" value={username ?? shortenAddress(initiaAddress)} />
        <StatRow label=".init identity" value={formatUsername(username)} />
        <StatRow label="Appchain" value={dripfiConfig.chain.chain_id} />
        <StatRow
          label="Automation"
          value={autoSignEnabled ? "Armed" : "Manual only"}
        />
        <StatRow
          label="Vault address"
          value={
            isConfiguredAddress(dripfiConfig.contracts.dcaVault)
              ? "Configured"
              : "Missing env"
          }
        />
        <StatRow
          label="Bridge asset"
          value={`${dripfiConfig.bridge.assetSymbol} -> ${dripfiConfig.bridge.dstDenom}`}
        />
        <StatRow
          label="Relayer"
          value={automationRelayerConfigured ? "Configured" : "Missing env"}
        />
        <StatRow label="JSON-RPC" value={rpcHealth.shortLabel} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => {
            if (isConnected) {
              openWallet();
              return;
            }

            openConnect();
          }}
          className="rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-medium text-slate-950 hover:-translate-y-0.5 hover:bg-[#e7e7e7]"
        >
          {isConnected ? "Open wallet" : "Connect wallet"}
        </button>
        <button
          onClick={() => openRealBridge()}
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          {`Bridge ${dripfiConfig.bridge.assetSymbol}`}
        </button>
        <button
          onClick={autoSignEnabled ? disableAutosign : enableAutosign}
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--mint)] hover:text-[var(--mint)]"
        >
          {autoSignEnabled ? "Disable automation" : "Enable automation"}
        </button>
      </div>

      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">{status}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--muted)]">{rpcHealth.detail}</p>
      {autoSignGrantee ? (
        <p className="mt-1 text-xs leading-6 text-[var(--gold)]">
          Grantee: {autoSignGrantee}
        </p>
      ) : null}
      {isPending ? (
        <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
          Processing on-chain action...
        </p>
      ) : null}
      {!automationRelayerConfigured ? (
        <p className="mt-1 text-xs leading-6 text-[var(--gold)]">
          Add `NEXT_PUBLIC_AUTOMATION_RELAYER_ADDRESS` and the matching server relayer key in
          Vercel, then connect an external scheduler or Vercel Pro cron to keep due strategies
          executing after the tab closes.
        </p>
      ) : null}
    </section>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </p>
      <p className="text-sm font-medium text-[var(--ink)]">{value}</p>
    </div>
  );
}
