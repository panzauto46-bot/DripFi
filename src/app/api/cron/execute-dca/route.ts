import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { dcaVaultAbi } from "@/lib/dripfi-abi";
import { dripfiConfig, isConfiguredAddress } from "@/lib/dripfi-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxExecutionsPerRun = Number(process.env.AUTOMATION_MAX_EXECUTIONS_PER_RUN ?? 5);

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function runExecutor() {
  const rpcUrl = dripfiConfig.chain.apis["json-rpc"][0]?.address;
  const vaultAddress = dripfiConfig.contracts.dcaVault;
  const relayerPrivateKey = process.env.AUTOMATION_RELAYER_PRIVATE_KEY as Hex | undefined;
  if (!rpcUrl || !relayerPrivateKey || !isConfiguredAddress(vaultAddress)) {
    return {
      ok: false as const,
      reason: "Missing JSON-RPC URL, vault address, or relayer private key.",
    };
  }

  const account = privateKeyToAccount(relayerPrivateKey);
  const publicClient = createPublicClient({ transport: http(rpcUrl) });
  const walletClient = createWalletClient({
    account,
    transport: http(rpcUrl),
  });
  const strategyCount = Number(
    await publicClient.readContract({
      address: vaultAddress as Address,
      abi: dcaVaultAbi,
      functionName: "strategyCount",
    }),
  );
  const readyStrategies: bigint[] = [];

  for (let strategyId = 1; strategyId <= strategyCount; strategyId += 1) {
    const id = BigInt(strategyId);
    const [canExecute, isAuthorizedExecutor] = await Promise.all([
      publicClient.readContract({
        address: vaultAddress as Address,
        abi: dcaVaultAbi,
        functionName: "canExecuteStrategy",
        args: [id],
      }),
      publicClient.readContract({
        address: vaultAddress as Address,
        abi: dcaVaultAbi,
        functionName: "isExecutionAuthorized",
        args: [id, account.address],
      }),
    ]);

    if (!canExecute || !isAuthorizedExecutor) {
      continue;
    }

    readyStrategies.push(id);
    if (readyStrategies.length >= maxExecutionsPerRun) {
      break;
    }
  }

  const executed: Array<{ strategyId: string; hash: string }> = [];
  const failed: Array<{ strategyId: string; error: string }> = [];

  for (const strategyId of readyStrategies) {
    try {
      const { request } = await publicClient.simulateContract({
        account,
        address: vaultAddress as Address,
        abi: dcaVaultAbi,
        functionName: "executeOrder",
        args: [strategyId],
      });
      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      executed.push({ strategyId: strategyId.toString(), hash });
    } catch (error) {
      failed.push({
        strategyId: strategyId.toString(),
        error: error instanceof Error ? error.message : "Unknown execution error.",
      });
    }
  }

  return {
    ok: true as const,
    scannedStrategies: strategyCount,
    readyStrategies: readyStrategies.map((strategyId) => strategyId.toString()),
    executed,
    failed,
    executor: account.address,
  };
}

async function handleRequest(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runExecutor();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Executor failed.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
