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
    detail: "Background execution is armed for recurring orders.",
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

export function useDripfiLiveState() {
  const { initiaAddress, hexAddress, username } = useInterwovenKit() as InterwovenKitShape;
  const usernameQuery = useUsernameQuery(initiaAddress);

  const hasLiveContracts =
    isConfiguredAddress(dripfiConfig.contracts.dcaVault) &&
    isConfiguredAddress(dripfiConfig.tokens.usdc.address) &&
    isConfiguredAddress(dripfiConfig.tokens.init.address) &&
    Boolean(dripfiConfig.chain.apis["json-rpc"][0]?.address);
  const isScaffoldMode = !hasLiveContracts;

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
      const tokenMetadataCache = new Map<
        string,
        Promise<{ symbol: string; decimals: number }>
      >();

      const getTokenMetadata = (address: Address) => {
        const cacheKey = address.toLowerCase();
        const cached = tokenMetadataCache.get(cacheKey);
        if (cached) return cached;

        const fallback =
          cacheKey === dripfiConfig.tokens.usdc.address.toLowerCase()
            ? {
                symbol: dripfiConfig.tokens.usdc.symbol,
                decimals: dripfiConfig.tokens.usdc.decimals,
              }
            : cacheKey === dripfiConfig.tokens.init.address.toLowerCase()
              ? {
                  symbol: dripfiConfig.tokens.init.symbol,
                  decimals: dripfiConfig.tokens.init.decimals,
                }
              : {
                  symbol: `${address.slice(0, 6)}...${address.slice(-4)}`,
                  decimals: 18,
                };

        const metadataPromise = Promise.all([
          publicClient!
            .readContract({
              address,
              abi: erc20Abi,
              functionName: "symbol",
            })
            .catch(() => fallback.symbol),
          publicClient!
            .readContract({
              address,
              abi: erc20Abi,
              functionName: "decimals",
            })
            .catch(() => fallback.decimals),
        ]).then(([symbol, decimals]) => ({
          symbol,
          decimals: Number(decimals),
        }));

        tokenMetadataCache.set(cacheKey, metadataPromise);
        return metadataPromise;
      };

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
          const [nextExecutionAt, canExecute, history, tokenInMeta, tokenOutMeta] =
            await Promise.all([
              publicClient!.readContract({
                address: vaultAddress,
                abi: dcaVaultAbi,
                functionName: "nextExecutionAt",
                args: [strategyId],
              }),
              publicClient!.readContract({
                address: vaultAddress,
                abi: dcaVaultAbi,
                functionName: "canExecuteStrategy",
                args: [strategyId],
              }),
              publicClient!.readContract({
                address: vaultAddress,
                abi: dcaVaultAbi,
                functionName: "getExecutionHistory",
                args: [strategyId],
              }),
              getTokenMetadata(tokenIn),
              getTokenMetadata(tokenOut),
            ]);

          const statusValue = Number(status);
          const statusTone = strategyStatusTone(statusValue);
          const historyLength = history.length;
          const nextExecutionLabel =
            statusTone === "paused"
              ? "Paused"
              : statusTone === "completed"
                ? "Completed"
                : statusTone === "stopped"
                  ? "Stopped"
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
            name: `${tokenInMeta.symbol} -> ${tokenOutMeta.symbol} DCA`,
            cadence: intervalLabelFromSeconds(Number(interval)),
            amount: `${formatTokenAmount(amountPerOrder, tokenInMeta.decimals)} ${tokenInMeta.symbol} / execution`,
            progress: `${historyLength} executions recorded`,
            status: strategyStatusLabel(statusValue),
            statusTone,
            canExecute,
            nextExecutionAt: Number(nextExecutionAt),
            nextExecutionLabel,
            availableBalanceLabel: `${formatTokenAmount(availableBalance, tokenInMeta.decimals)} ${tokenInMeta.symbol}`,
            amountPerOrder,
            availableBalance,
            history,
            tokenInSymbol: tokenInMeta.symbol,
            tokenInDecimals: tokenInMeta.decimals,
          };
        }),
      );

      return strategyRows;
    },
  });

  const activityFeed = useMemo(() => {
    if (isScaffoldMode) {
      return [...mockActivityFeed];
    }
    if (!strategiesQuery.data || strategiesQuery.data.length === 0) {
      return [];
    }

    const historyItems = strategiesQuery.data.flatMap((strategy) =>
      strategy.history.map((entry) => ({
        time: new Date(Number(entry.executedAt) * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        action: `${strategy.name} executed`,
        detail: `${formatTokenAmount(entry.amountIn, strategy.tokenInDecimals)} ${strategy.tokenInSymbol} swapped into the configured output token.`,
        executedAt: Number(entry.executedAt),
      })),
    );

    const sorted = historyItems.sort((left, right) => right.executedAt - left.executedAt);
    return sorted.slice(0, 6).map((item) => ({
      time: item.time,
      action: item.action,
      detail: item.detail,
    }));
  }, [isScaffoldMode, strategiesQuery.data]);

  return {
    identity:
      username ?? usernameQuery.data ?? (initiaAddress ? shortenHexAddress(initiaAddress) : "Guest"),
    initiaAddress,
    hexAddress,
    hasLiveContracts,
    isScaffoldMode,
    isLoadingStrategies: strategiesQuery.isLoading,
    strategies: isScaffoldMode ? [...mockStrategies] : (strategiesQuery.data ?? []),
    activityFeed,
    strategiesError:
      strategiesQuery.error instanceof Error ? strategiesQuery.error.message : null,
    refetchStrategies: strategiesQuery.refetch,
  };
}
