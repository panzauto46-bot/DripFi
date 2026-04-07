import { createPublicClient, http, type PublicClient } from "viem";
import { dripfiConfig } from "@/lib/dripfi-config";

export function createDripfiPublicClient(): PublicClient | null {
  const rpcUrl = dripfiConfig.chain.apis["json-rpc"][0]?.address;
  if (!rpcUrl) return null;

  return createPublicClient({
    transport: http(rpcUrl),
  });
}
