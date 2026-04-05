"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { createPublicClient, http, parseUnits, type Address } from "viem";
import { erc20Abi } from "@/lib/dripfi-abi";
import {
  buildApproveInput,
  buildAutoSignFee,
  buildCreateStrategyAndFundInput,
  buildMsgCallMessage,
  buildSetSessionKeyInput,
  buildVaultActionInput,
} from "@/lib/dca-messages";
import {
  dripfiConfig,
  getConfiguredToken,
  isConfiguredAddress,
} from "@/lib/dripfi-config";
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

type StrategyAction =
  | "pauseStrategy"
  | "resumeStrategy"
  | "cancelStrategy"
  | "withdrawFunds"
  | "executeOrder";

function invalidateKeys(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([queryClient.invalidateQueries({ queryKey: ["dripfi-strategies"] })]);
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
  const automationRelayerConfigured = isConfiguredAddress(
    dripfiConfig.automation.relayerAddress,
  );
  const hasLiveVault =
    isConfiguredAddress(dripfiConfig.contracts.dcaVault) &&
    isConfiguredAddress(dripfiConfig.tokens.usdc.address) &&
    isConfiguredAddress(dripfiConfig.tokens.init.address);

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

  async function createStrategyFromDraft(draft: StrategyDraft, intervalInSeconds: number) {
    if (!requireWallet()) return;
    if (!hasLiveVault || !publicClient || !hexAddress) {
      setStatus("Configure live contract and token addresses first.");
      return;
    }

    const tokenInConfig = getConfiguredToken(draft.tokenIn);
    const tokenOutConfig = getConfiguredToken(draft.tokenOut);
    if (draft.tokenIn === draft.tokenOut) {
      setStatus("Choose different funding and target tokens.");
      return;
    }
    if (
      !isConfiguredAddress(tokenInConfig.address) ||
      !isConfiguredAddress(tokenOutConfig.address)
    ) {
      setStatus("Configured token addresses are still missing.");
      return;
    }

    setIsPending(true);
    try {
      const tokenInAddress = tokenInConfig.address as Address;
      const tokenOutAddress = tokenOutConfig.address as Address;
      const tokenInDecimalsRaw = await publicClient
        .readContract({
          address: tokenInAddress,
          abi: erc20Abi,
          functionName: "decimals",
        })
        .catch(() => tokenInConfig.decimals);
      const tokenDecimals = Number(tokenInDecimalsRaw);
      const budget = parseUnits(draft.budget || "0", tokenDecimals);
      const amountPerOrder = parseUnits(draft.amountPerOrder || "0", tokenDecimals);
      if (budget <= 0n || amountPerOrder <= 0n) {
        setStatus("Amount per order and budget must be greater than zero.");
        return;
      }

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
              input: buildApproveInput(dripfiConfig.contracts.dcaVault as Address, budget),
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

      setStatus(`Strategy created and funded in ${tokenInConfig.symbol}.`);
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
      dstDenom: dripfiConfig.bridge.dstDenom,
      recipient: initiaAddress,
      sender: initiaAddress,
      quantity: quantity ?? "0",
      slippagePercent: "1",
    });
    setStatus(
      `Bridge drawer opened for ${dripfiConfig.bridge.assetSymbol} on ${dripfiConfig.bridge.dstDenom}.`,
    );
  }

  async function setAutomationRelayerApproval(approved: boolean) {
    if (!automationRelayerConfigured || !hasLiveVault) return;

    await requestTxBlock({
      chainId,
      messages: [
        buildMsgCallMessage({
          sender: initiaAddress!,
          contractAddr: dripfiConfig.contracts.dcaVault,
          input: buildSetSessionKeyInput(
            dripfiConfig.automation.relayerAddress as Address,
            approved,
          ),
        }),
      ],
    });
  }

  async function enableAutosign() {
    if (!requireWallet()) return;

    setIsPending(true);
    try {
      await autoSign.enable(chainId);
      await setAutomationRelayerApproval(true);
      setStatus(
        automationRelayerConfigured
          ? "Auto-sign and background automation enabled."
          : "Auto-sign enabled. Add an automation relayer env to unlock background execution.",
      );
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
      if (automationRelayerConfigured && hasLiveVault) {
        await setAutomationRelayerApproval(false);
      }
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
    automationRelayerConfigured,
    createStrategyFromDraft,
    runStrategyAction,
    openRealBridge,
    enableAutosign,
    disableAutosign,
    hasLiveVault,
  };
}
