export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const env = process.env;

export const dripfiConfig = {
  chain: {
    chain_id: env.NEXT_PUBLIC_APPCHAIN_ID ?? "dripfi-1",
    chain_name: env.NEXT_PUBLIC_CHAIN_NAME ?? "dripfi",
    pretty_name: env.NEXT_PUBLIC_CHAIN_PRETTY_NAME ?? "DripFi Appchain",
    network_type: "testnet",
    bech32_prefix: "init",
    logo_URIs: {
      png: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png",
      svg: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg",
    },
    apis: {
      rpc: [{ address: env.NEXT_PUBLIC_RPC_URL ?? "http://localhost:26657" }],
      rest: [{ address: env.NEXT_PUBLIC_REST_URL ?? "http://localhost:1317" }],
      indexer: [{ address: env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:8080" }],
      "json-rpc": [
        { address: env.NEXT_PUBLIC_JSON_RPC_URL ?? "http://localhost:8545" },
      ],
    },
    fees: {
      fee_tokens: [
        {
          denom: env.NEXT_PUBLIC_NATIVE_DENOM ?? "uinit",
          fixed_min_gas_price: 0,
          low_gas_price: 0,
          average_gas_price: 0,
          high_gas_price: 0,
        },
      ],
    },
    staking: {
      staking_tokens: [{ denom: env.NEXT_PUBLIC_NATIVE_DENOM ?? "uinit" }],
    },
    metadata: {
      minitia: { type: "minievm" },
      is_l1: false,
    },
    native_assets: [
      {
        denom: env.NEXT_PUBLIC_NATIVE_DENOM ?? "uinit",
        name: "Initia Native Token",
        symbol: env.NEXT_PUBLIC_NATIVE_SYMBOL ?? "INIT",
        decimals: Number(env.NEXT_PUBLIC_NATIVE_DECIMALS ?? 18),
      },
    ],
  },
  contracts: {
    dcaVault: env.NEXT_PUBLIC_DCA_VAULT_ADDRESS ?? ZERO_ADDRESS,
    swapRouter: env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS ?? ZERO_ADDRESS,
    compoundEngine: env.NEXT_PUBLIC_COMPOUND_ENGINE_ADDRESS ?? ZERO_ADDRESS,
  },
  tokens: {
    usdc: env.NEXT_PUBLIC_USDC_ADDRESS ?? ZERO_ADDRESS,
    init: env.NEXT_PUBLIC_INIT_TOKEN_ADDRESS ?? ZERO_ADDRESS,
  },
  bridge: {
    srcChainId: env.NEXT_PUBLIC_BRIDGE_SRC_CHAIN_ID ?? "initiation-2",
    srcDenom: env.NEXT_PUBLIC_BRIDGE_SRC_DENOM ?? "uinit",
  },
  submission: {
    chainId: "dripfi-1",
    executionFeeBps: 30,
    autoSignGasPrice: env.NEXT_PUBLIC_AUTOSIGN_GAS_PRICE ?? "0.015",
    autoExecutionPollMs: Number(env.NEXT_PUBLIC_AUTO_EXECUTION_POLL_MS ?? 30000),
  },
} as const;

export type DcaInterval = "hourly" | "daily" | "weekly";

export const intervalSeconds: Record<DcaInterval, number> = {
  hourly: 60 * 60,
  daily: 60 * 60 * 24,
  weekly: 60 * 60 * 24 * 7,
};

export const intervalLabels: Record<DcaInterval, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
};

export const strategyTemplates = [
  {
    id: "safe-dca",
    name: "Safe DCA",
    amountPerOrder: "10",
    interval: "weekly" as DcaInterval,
    budget: "250",
    description: "Steady weekly accumulation for calmer entries.",
  },
  {
    id: "aggressive-dca",
    name: "Aggressive DCA",
    amountPerOrder: "24",
    interval: "daily" as DcaInterval,
    budget: "720",
    description: "Faster exposure with a daily execution schedule.",
  },
  {
    id: "yield-compounder",
    name: "Yield Compounder",
    amountPerOrder: "6",
    interval: "hourly" as DcaInterval,
    budget: "432",
    description: "A higher-frequency setting for automation-oriented users.",
  },
];

export const prdSyncStatus = [
  {
    label: "Repo structure",
    status: "synced",
    detail: "Root repo, contracts, frontend, and .initia folder now exist.",
  },
  {
    label: "InterwovenKit",
    status: "wired",
    detail: "Provider and wallet/bridge entry points are scaffolded in the frontend.",
  },
  {
    label: "Smart contracts",
    status: "scaffolded",
    detail: "DCAVault, SwapRouter, CompoundEngine, and a Foundry test scaffold are included.",
  },
  {
    label: "Submission assets",
    status: "partial",
    detail: "README and submission.json exist locally, but deploy links and video remain pending.",
  },
];

export function isConfiguredAddress(address: string) {
  return Boolean(address) && address !== ZERO_ADDRESS;
}
