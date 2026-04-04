"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { createPublicClient, http, parseUnits, type Address } from "viem";
import { erc20Abi } from "@/lib/dripfi-abi";
import { buildApproveInput, buildAutoSignFee, buildCreateStrategyAndFundInput, buildMsgCallMessage, buildSetSessionKeyInput, buildVaultActionInput } from "@/lib/dca-messages";
import { dripfiConfig, isConfiguredAddress } from "@/lib/dripfi-config";
import type { StrategyDraft } from "@/hooks/use-dripfi-demo-state";

type InterwovenKitShape = {
  initiaAddress?: string;
  hexAddress?: string;
  openBridge: (options?: Record<string, unknown>) => void;
  openConnect: () => void;
  requestTxBlock: (payload: unknown) => Promise<unknown>;
  submitTxBlock: (payload: unknown) => Promise<unknown>;
  estimateGas: (payload: unknown) => Promise<number>;
  autoSign: {
    enable: (chainId?: string) => Promise<void>;
    disable: (chainId?: string) => Promise<void>;
    isEnabledByChain: Record<string, boolean>;
    granteeByChain: Record<string, string | undefined>;
    isLoading: boolean;
  };
};

type StrategyAction = "pauseStrategy" | "resumeStrategy" | "cancelStrategy" | "withdrawFunds" | "executeOrder";

function invalidateKeys(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["dripfi-strategies"] }),
  ]);
}

function resolveTokenAddress(input: string, fallback: string) {
  return input.startsWith("0x") && input.length === 42 ? (input as Address) : (fallback as Address);
}

export function useDripfiActions() {
  const queryClient = useQueryClient();
  const {
    initiaAddress,
    hexAddress,
    openBridge,
    openConnect,
    requestTxBlock,
    submitTxBlock,
    estimateGas,
    autoSign,
  } = useInterwovenKit() as InterwovenKitShape;
  const [status, setStatus] = useState("Ready.");
  const [isPending, setIsPending] = useState(false);

  const publicClient = useMemo(() => {
    const rpcUrl = dripfiConfig.chain.apis["json-rpc"][0]?.address;
    if (!rpcUrl) return null;
    return createPublicClient({ transport: http(rpcUrl) });
  }, []);

  const chainId = dripfiConfig.chain.chain_id;
  const hasLiveVault =
    isConfiguredAddress(dripfiConfig.contracts.dcaVault) &&
    isConfiguredAddress(dripfiConfig.tokens.usdc) &&
    isConfiguredAddress(dripfiConfig.tokens.init);

  async function submitMessages(
    messages: ReturnType<typeof buildMsgCallMessage>[],
    preferAutoSign = false,
  ) {
    if (preferAutoSign && autoSign.isEnabledByChain[chainId]) {
      const gasEstimate = await estimateGas({ chainId, messages });
      const fee = buildAutoSignFee({
        gasEstimate,
        denom: dripfiConfig.chain.native_assets[0].denom,
        gasPrice: dripfiConfig.submission.autoSignGasPrice,
      });

      return submitTxBlock({
        chainId,
        messages,
        fee,
        preferredFeeDenom: dripfiConfig.chain.native_assets[0].denom,
      });
    }

    return requestTxBlock({ chainId, messages });
  }

  function requireWallet() {
    if (!initiaAddress) {
      openConnect();
      setStatus("Connect wallet first.");
      return false;
    }
    return true;
  }

  async function createStrategyFromDraft(
    draft: StrategyDraft,
    intervalInSeconds: number,
    tokenDecimals: number,
  ) {
    if (!requireWallet()) return;
    if (!hasLiveVault || !publicClient || !hexAddress) {
      setStatus("Configure live contract and token addresses first.");
      return;
    }

    setIsPending(true);
    try {
      const tokenInAddress = resolveTokenAddress(draft.tokenIn, dripfiConfig.tokens.usdc);
      const tokenOutAddress = resolveTokenAddress(draft.tokenOut, dripfiConfig.tokens.init);
      const budget = parseUnits(draft.budget || "0", tokenDecimals);
      const allowance = await publicClient.readContract({
        address: tokenInAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [hexAddress as Address, dripfiConfig.contracts.dcaVault as Address],
      });

      if (allowance < budget) {
        await requestTxBlock({
          chainId,
          messages: [
            buildMsgCallMessage({
              sender: initiaAddress!,
              contractAddr: tokenInAddress,
              input: buildApproveInput(
                dripfiConfig.contracts.dcaVault as Address,
                budget,
              ),
            }),
          ],
        });
      }

      await requestTxBlock({
        chainId,
        messages: [
          buildMsgCallMessage({
            sender: initiaAddress!,
            contractAddr: dripfiConfig.contracts.dcaVault,
            input: buildCreateStrategyAndFundInput({
              tokenIn: tokenInAddress,
              tokenOut: tokenOutAddress,
              amountPerOrder: draft.amountPerOrder,
              budget: draft.budget,
              decimals: tokenDecimals,
              intervalInSeconds,
            }),
          }),
        ],
      });

      setStatus("Strategy created and funded.");
      await invalidateKeys(queryClient);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create strategy.");
    } finally {
      setIsPending(false);
    }
  }

  async function runStrategyAction(strategyId: bigint, action: StrategyAction) {
    if (!requireWallet()) return;
    if (!hasLiveVault) {
      setStatus("Live vault address is still missing.");
      return;
    }

    setIsPending(true);
    try {
      const preferAutoSign = action === "executeOrder";
      await submitMessages(
        [
          buildMsgCallMessage({
            sender: initiaAddress!,
            contractAddr: dripfiConfig.contracts.dcaVault,
            input: buildVaultActionInput(action, strategyId),
          }),
        ],
        preferAutoSign,
      );
      setStatus(`${action} confirmed.`);
      await invalidateKeys(queryClient);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `Failed to ${action}.`);
    } finally {
      setIsPending(false);
    }
  }

  function openRealBridge(quantity?: string) {
    if (!requireWallet()) return;

    openBridge({
      srcChainId: dripfiConfig.bridge.srcChainId,
      srcDenom: dripfiConfig.bridge.srcDenom,
      dstChainId: dripfiConfig.chain.chain_id,
      dstDenom: dripfiConfig.chain.native_assets[0].denom,
      recipient: initiaAddress,
      sender: initiaAddress,
      quantity: quantity ?? "0",
      slippagePercent: "1",
    });
    setStatus("Bridge drawer opened with DripFi defaults.");
  }

  async function enableAutosign() {
    if (!requireWallet()) return;

    setIsPending(true);
    try {
      await autoSign.enable(chainId);

      const grantee = autoSign.granteeByChain[chainId];
      if (grantee?.startsWith("0x") && hasLiveVault) {
        await requestTxBlock({
          chainId,
          messages: [
            buildMsgCallMessage({
              sender: initiaAddress!,
              contractAddr: dripfiConfig.contracts.dcaVault,
              input: buildSetSessionKeyInput(grantee as Address, true),
            }),
          ],
        });
      }

      setStatus("Auto-sign enabled.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to enable auto-sign.");
    } finally {
      setIsPending(false);
    }
  }

  async function disableAutosign() {
    if (!requireWallet()) return;

    setIsPending(true);
    try {
      await autoSign.disable(chainId);
      setStatus("Auto-sign disabled.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to disable auto-sign.");
    } finally {
      setIsPending(false);
    }
  }

  return {
    status,
    isPending: isPending || autoSign.isLoading,
    autoSignEnabled: autoSign.isEnabledByChain[chainId] ?? false,
    autoSignGrantee: autoSign.granteeByChain[chainId],
    createStrategyFromDraft,
    runStrategyAction,
    openRealBridge,
    enableAutosign,
    disableAutosign,
    hasLiveVault,
  };
}
