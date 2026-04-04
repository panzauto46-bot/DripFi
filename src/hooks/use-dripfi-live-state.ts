"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useInterwovenKit, useUsernameQuery } from "@initia/interwovenkit-react";
import { createPublicClient, http, type Address } from "viem";
import { dcaVaultAbi, erc20Abi } from "@/lib/dripfi-abi";
import { dripfiConfig, isConfiguredAddress } from "@/lib/dripfi-config";
import {
  formatTokenAmount,
  intervalLabelFromSeconds,
  strategyStatusLabel,
  strategyStatusTone,
} from "@/lib/dripfi-metrics";

type InterwovenKitShape = {
  initiaAddress?: string;
  hexAddress?: string;
  username?: string | null;
};

const mockStrategies = [
  {
    id: 1n,
    name: "INIT Core Stack",
    cadence: "Daily",
    amount: "$24 / execution",
    progress: "3 executions recorded",
    status: "Running",
    statusTone: "running",
    canExecute: true,
    nextExecutionLabel: "Ready now",
    availableBalanceLabel: "696 USDC",
    availableBalance: 696n * 10n ** 18n,
  },
  {
    id: 2n,
    name: "ETH -> INIT Rotation",
    cadence: "Weekly",
    amount: "$80 / execution",
    progress: "1 execution recorded",
    status: "Paused",
    statusTone: "paused",
    canExecute: false,
    nextExecutionLabel: "Paused",
    availableBalanceLabel: "320 USDC",
    availableBalance: 320n * 10n ** 18n,
  },
] as const;

const mockActivityFeed = [
  {
    time: "09:00",
    action: "Bridge settled from Ethereum",
    detail: "420 USDC landed in the connected wallet.",
  },
  {
    time: "09:05",
    action: "Auto-sign enabled",
    detail: "MsgCall autosign is ready for recurring execution.",
  },
  {
    time: "09:30",
    action: "Daily drip executed",
    detail: "24 USDC swapped into INIT.",
  },
  {
    time: "09:31",
    action: "PnL recalculated",
    detail: "Average entry updated after the latest buy.",
  },
] as const;

function shortenHexAddress(address?: string | null) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function symbolFromAddress(address: Address) {
  if (address.toLowerCase() === dripfiConfig.tokens.usdc.toLowerCase()) return "USDC";
  if (address.toLowerCase() === dripfiConfig.tokens.init.toLowerCase()) return "INIT";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function useDripfiLiveState() {
  const { initiaAddress, hexAddress, username } = useInterwovenKit() as InterwovenKitShape;
  const usernameQuery = useUsernameQuery(initiaAddress);

  const hasLiveContracts =
    isConfiguredAddress(dripfiConfig.contracts.dcaVault) &&
    isConfiguredAddress(dripfiConfig.tokens.usdc) &&
    isConfiguredAddress(dripfiConfig.tokens.init) &&
    Boolean(dripfiConfig.chain.apis["json-rpc"][0]?.address);

  const publicClient = useMemo(() => {
    const rpcUrl = dripfiConfig.chain.apis["json-rpc"][0]?.address;
    if (!rpcUrl) return null;

    return createPublicClient({
      transport: http(rpcUrl),
    });
  }, []);

  const strategiesQuery = useQuery({
    queryKey: ["dripfi-strategies", hexAddress, dripfiConfig.contracts.dcaVault],
    enabled: Boolean(publicClient && hexAddress && hasLiveContracts),
    refetchInterval: 15_000,
    queryFn: async () => {
      const owner = hexAddress as Address;
      const vaultAddress = dripfiConfig.contracts.dcaVault as Address;
      const ids = await publicClient!.readContract({
        address: vaultAddress,
        abi: dcaVaultAbi,
        functionName: "getStrategyIdsByOwner",
        args: [owner],
      });

      const strategyRows = await Promise.all(
        ids.map(async (strategyId) => {
          const strategy = await publicClient!.readContract({
            address: vaultAddress,
            abi: dcaVaultAbi,
            functionName: "strategies",
            args: [strategyId],
          });
          const [
            ,
            tokenIn,
            tokenOut,
            ,
            amountPerOrder,
            interval,
            ,
            availableBalance,
            status,
          ] = strategy;
          const nextExecutionAt = await publicClient!.readContract({
            address: vaultAddress,
            abi: dcaVaultAbi,
            functionName: "nextExecutionAt",
            args: [strategyId],
          });
          const canExecute = await publicClient!.readContract({
            address: vaultAddress,
            abi: dcaVaultAbi,
            functionName: "canExecuteStrategy",
            args: [strategyId],
          });
          const history = await publicClient!.readContract({
            address: vaultAddress,
            abi: dcaVaultAbi,
            functionName: "getExecutionHistory",
            args: [strategyId],
          });

          const tokenInSymbol =
            tokenIn.toLowerCase() === dripfiConfig.tokens.usdc.toLowerCase()
              ? "USDC"
              : await publicClient!.readContract({
                  address: tokenIn,
                  abi: erc20Abi,
                  functionName: "symbol",
                }).catch(() => symbolFromAddress(tokenIn));

          const tokenOutSymbol =
            tokenOut.toLowerCase() === dripfiConfig.tokens.init.toLowerCase()
              ? "INIT"
              : await publicClient!.readContract({
                  address: tokenOut,
                  abi: erc20Abi,
                  functionName: "symbol",
                }).catch(() => symbolFromAddress(tokenOut));

          const historyLength = history.length;
          const nextExecutionLabel =
            status === 1
              ? "Paused"
              : canExecute
                ? "Ready now"
                : new Date(Number(nextExecutionAt) * 1000).toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  });

          return {
            id: strategyId,
            name: `${tokenInSymbol} -> ${tokenOutSymbol} DCA`,
            cadence: intervalLabelFromSeconds(Number(interval)),
            amount: `${formatTokenAmount(amountPerOrder)} ${tokenInSymbol} / execution`,
            progress: `${historyLength} executions recorded`,
            status: strategyStatusLabel(Number(status)),
            statusTone: strategyStatusTone(Number(status)),
            canExecute,
            nextExecutionAt: Number(nextExecutionAt),
            nextExecutionLabel,
            availableBalanceLabel: `${formatTokenAmount(availableBalance)} ${tokenInSymbol}`,
            amountPerOrder,
            availableBalance,
            history,
          };
        }),
      );

      return strategyRows;
    },
  });

  const activityFeed = useMemo(() => {
    if (!strategiesQuery.data || strategiesQuery.data.length === 0) {
      return [...mockActivityFeed];
    }

    const historyItems = strategiesQuery.data.flatMap((strategy) =>
      strategy.history.map((entry) => ({
        time: new Date(Number(entry.executedAt) * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        action: `${strategy.name} executed`,
        detail: `${formatTokenAmount(entry.amountIn)} input swapped for the configured output token.`,
        executedAt: Number(entry.executedAt),
      })),
    );

    const sorted = historyItems.sort((left, right) => right.executedAt - left.executedAt);
    if (sorted.length === 0) {
      return [...mockActivityFeed];
    }

    return sorted.slice(0, 6).map((item) => ({
      time: item.time,
      action: item.action,
      detail: item.detail,
    }));
  }, [strategiesQuery.data]);

  return {
    identity:
      username ?? usernameQuery.data ?? (initiaAddress ? shortenHexAddress(initiaAddress) : "Guest"),
    initiaAddress,
    hexAddress,
    hasLiveContracts,
    isLoadingStrategies: strategiesQuery.isLoading,
    strategies: strategiesQuery.data?.length ? strategiesQuery.data : [...mockStrategies],
    activityFeed,
    refetchStrategies: strategiesQuery.refetch,
  };
}
