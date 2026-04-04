import { calculateFee, GasPrice } from "@cosmjs/stargate";
import { encodeFunctionData, parseUnits, type Address } from "viem";
import { dcaVaultAbi, erc20Abi } from "@/lib/dripfi-abi";

type MsgCallParams = {
  sender: string;
  contractAddr: string;
  input: string;
  value?: string;
};

type CreateAndFundParams = {
  tokenIn: Address;
  tokenOut: Address;
  amountPerOrder: string;
  budget: string;
  decimals: number;
  intervalInSeconds: number;
};

export function buildMsgCallMessage({
  sender,
  contractAddr,
  input,
  value = "0",
}: MsgCallParams) {
  return {
    typeUrl: "/minievm.evm.v1.MsgCall",
    value: {
      sender: sender.toLowerCase(),
      contractAddr,
      input,
      value,
      accessList: [],
      authList: [],
    },
  };
}

export function buildApproveInput(spender: Address, amount: bigint) {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
  });
}

export function buildCreateStrategyAndFundInput({
  tokenIn,
  tokenOut,
  amountPerOrder,
  budget,
  decimals,
  intervalInSeconds,
}: CreateAndFundParams) {
  return encodeFunctionData({
    abi: dcaVaultAbi,
    functionName: "createStrategyAndFund",
    args: [
      tokenIn,
      tokenOut,
      parseUnits(amountPerOrder || "0", decimals),
      BigInt(intervalInSeconds),
      parseUnits(budget || "0", decimals),
    ],
  });
}

export function buildVaultActionInput(
  action:
    | "pauseStrategy"
    | "resumeStrategy"
    | "cancelStrategy"
    | "withdrawFunds"
    | "executeOrder",
  strategyId: bigint,
) {
  return encodeFunctionData({
    abi: dcaVaultAbi,
    functionName: action,
    args: [strategyId],
  });
}

export function buildSetSessionKeyInput(sessionKey: Address, approved: boolean) {
  return encodeFunctionData({
    abi: dcaVaultAbi,
    functionName: "setSessionKey",
    args: [sessionKey, approved],
  });
}

export function buildAutoSignFee({
  gasEstimate,
  denom,
  gasPrice,
}: {
  gasEstimate: number;
  denom: string;
  gasPrice: string;
}) {
  const gas = Math.max(150000, Math.ceil(gasEstimate * 1.25));
  return calculateFee(gas, GasPrice.fromString(`${gasPrice}${denom}`));
}
