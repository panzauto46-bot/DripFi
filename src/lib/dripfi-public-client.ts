import {
  createPublicClient,
  custom,
  http,
  type EIP1193Provider,
  type PublicClient,
} from "viem";
import { dripfiConfig } from "@/lib/dripfi-config";

export function createDripfiPublicClient(preferInjected = false): PublicClient | null {
  const injectedProvider =
    typeof window !== "undefined" && preferInjected
      ? (window as Window & { ethereum?: EIP1193Provider }).ethereum
      : undefined;

  if (injectedProvider) {
    return createPublicClient({
      transport: custom(injectedProvider),
    });
  }

  const rpcUrl = dripfiConfig.chain.apis["json-rpc"][0]?.address;
  if (!rpcUrl) return null;

  return createPublicClient({
    transport: http(rpcUrl),
  });
}
