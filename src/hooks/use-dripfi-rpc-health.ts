"use client";

import { useQuery } from "@tanstack/react-query";
import { dripfiConfig } from "@/lib/dripfi-config";

type RpcEndpointKind = "missing" | "invalid" | "local" | "quick-tunnel" | "remote";

function classifyRpcUrl(rpcUrl?: string): RpcEndpointKind {
  if (!rpcUrl) return "missing";

  try {
    const url = new URL(rpcUrl);
    const host = url.hostname.toLowerCase();

    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
      return "local";
    }

    if (host.endsWith(".trycloudflare.com")) {
      return "quick-tunnel";
    }

    return "remote";
  } catch {
    return "invalid";
  }
}

export function useDripfiRpcHealth() {
  const rpcUrl = dripfiConfig.chain.apis["json-rpc"][0]?.address;
  const endpointKind = classifyRpcUrl(rpcUrl);

  const healthQuery = useQuery({
    queryKey: ["dripfi-rpc-health", rpcUrl],
    enabled: endpointKind === "quick-tunnel" || endpointKind === "remote",
    retry: false,
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await fetch(rpcUrl!, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC responded with ${response.status}.`);
      }

      const payload = (await response.json()) as {
        result?: string;
        error?: { message?: string };
      };

      if (payload.error?.message) {
        throw new Error(payload.error.message);
      }

      if (!payload.result) {
        throw new Error("RPC did not return a chain ID.");
      }

      return payload.result;
    },
  });

  if (endpointKind === "missing") {
    return {
      isReachable: false,
      isStablePublicEndpoint: false,
      isChecking: false,
      tone: "warning" as const,
      shortLabel: "JSON-RPC env missing",
      detail:
        "Add NEXT_PUBLIC_JSON_RPC_URL before using live contracts from the dashboard.",
      rpcUrl,
    };
  }

  if (endpointKind === "invalid") {
    return {
      isReachable: false,
      isStablePublicEndpoint: false,
      isChecking: false,
      tone: "warning" as const,
      shortLabel: "JSON-RPC URL invalid",
      detail:
        "The configured NEXT_PUBLIC_JSON_RPC_URL is not a valid URL. Update the Vercel env and redeploy.",
      rpcUrl,
    };
  }

  if (endpointKind === "local") {
    return {
      isReachable: false,
      isStablePublicEndpoint: false,
      isChecking: false,
      tone: "warning" as const,
      shortLabel: "JSON-RPC points to localhost",
      detail:
        "A public Vercel site cannot reach localhost. Replace the RPC env with a public endpoint and redeploy.",
      rpcUrl,
    };
  }

  if (healthQuery.isLoading) {
    return {
      isReachable: false,
      isStablePublicEndpoint: endpointKind === "remote",
      isChecking: true,
      tone: "neutral" as const,
      shortLabel: "Checking JSON-RPC",
      detail: "Verifying that the configured MiniEVM endpoint is reachable from the browser.",
      rpcUrl,
    };
  }

  if (healthQuery.error) {
    return {
      isReachable: false,
      isStablePublicEndpoint: false,
      isChecking: false,
      tone: "warning" as const,
      shortLabel:
        endpointKind === "quick-tunnel"
          ? "Quick tunnel offline"
          : "JSON-RPC unreachable",
      detail:
        endpointKind === "quick-tunnel"
          ? "The current trycloudflare tunnel is down. Start the rollup tunnel again, update the Vercel env with the fresh URL, then redeploy."
          : `The configured JSON-RPC endpoint could not be reached${
              healthQuery.error instanceof Error ? `: ${healthQuery.error.message}` : "."
            }`,
      rpcUrl,
    };
  }

  if (endpointKind === "quick-tunnel") {
    return {
      isReachable: true,
      isStablePublicEndpoint: false,
      isChecking: false,
      tone: "warning" as const,
      shortLabel: "Quick tunnel connected",
      detail:
        "The JSON-RPC endpoint is reachable now, but trycloudflare URLs are temporary and can break the public dashboard at any time.",
      rpcUrl,
    };
  }

  return {
    isReachable: true,
    isStablePublicEndpoint: true,
    isChecking: false,
    tone: "positive" as const,
    shortLabel: "JSON-RPC reachable",
    detail: "The configured MiniEVM endpoint is responding.",
    rpcUrl,
  };
}
