export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const nativeDecimals = Number(process.env.NEXT_PUBLIC_NATIVE_DECIMALS ?? 18);

export const configuredTokenKeys = ["usdc", "init"] as const;
export type ConfiguredTokenKey = (typeof configuredTokenKeys)[number];

export const dripfiConfig = {
  chain: {
    chain_id: process.env.NEXT_PUBLIC_APPCHAIN_ID ?? "dripfi-1",
    chain_name: process.env.NEXT_PUBLIC_CHAIN_NAME ?? "dripfi",
    pretty_name: process.env.NEXT_PUBLIC_CHAIN_PRETTY_NAME ?? "DripFi Appchain",
    network_type: "testnet",
    bech32_prefix: "init",
    logo_URIs: {
      png: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png",
      svg: "https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg",
    },
    apis: {
      rpc: [{ address: process.env.NEXT_PUBLIC_RPC_URL ?? "http://localhost:26657" }],
      rest: [{ address: process.env.NEXT_PUBLIC_REST_URL ?? "http://localhost:1317" }],
      indexer: [
        { address: process.env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:8080" },
      ],
      "json-rpc": [
        { address: process.env.NEXT_PUBLIC_JSON_RPC_URL ?? "http://localhost:8545" },
      ],
    },
    fees: {
      fee_tokens: [
        {
          denom: process.env.NEXT_PUBLIC_NATIVE_DENOM ?? "uinit",
          fixed_min_gas_price: 0,
          low_gas_price: 0,
          average_gas_price: 0,
          high_gas_price: 0,
        },
      ],
    },
    staking: {
      staking_tokens: [{ denom: process.env.NEXT_PUBLIC_NATIVE_DENOM ?? "uinit" }],
    },
    metadata: {
      minitia: { type: "minievm" },
      is_l1: false,
    },
    native_assets: [
      {
        denom: process.env.NEXT_PUBLIC_NATIVE_DENOM ?? "uinit",
        name: "Initia Native Token",
        symbol: process.env.NEXT_PUBLIC_NATIVE_SYMBOL ?? "INIT",
        decimals: nativeDecimals,
      },
    ],
  },
  contracts: {
    dcaVault: process.env.NEXT_PUBLIC_DCA_VAULT_ADDRESS ?? ZERO_ADDRESS,
    swapRouter: process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS ?? ZERO_ADDRESS,
    compoundEngine: process.env.NEXT_PUBLIC_COMPOUND_ENGINE_ADDRESS ?? ZERO_ADDRESS,
  },
  tokens: {
    usdc: {
      key: "usdc",
      label: "USDC",
      symbol: "USDC",
      address: process.env.NEXT_PUBLIC_USDC_ADDRESS ?? ZERO_ADDRESS,
      decimals: Number(process.env.NEXT_PUBLIC_USDC_DECIMALS ?? 6),
    },
    init: {
      key: "init",
      label: process.env.NEXT_PUBLIC_NATIVE_SYMBOL ?? "INIT",
      symbol: process.env.NEXT_PUBLIC_NATIVE_SYMBOL ?? "INIT",
      address: process.env.NEXT_PUBLIC_INIT_TOKEN_ADDRESS ?? ZERO_ADDRESS,
      decimals: Number(process.env.NEXT_PUBLIC_INIT_TOKEN_DECIMALS ?? nativeDecimals),
    },
  },
  bridge: {
    srcChainId: process.env.NEXT_PUBLIC_BRIDGE_SRC_CHAIN_ID ?? "initiation-2",
    srcDenom: process.env.NEXT_PUBLIC_BRIDGE_SRC_DENOM ?? "uinit",
    dstDenom:
      process.env.NEXT_PUBLIC_BRIDGE_DST_DENOM ??
      process.env.NEXT_PUBLIC_NATIVE_DENOM ??
      "uinit",
    assetSymbol:
      process.env.NEXT_PUBLIC_BRIDGE_ASSET_SYMBOL ??
      process.env.NEXT_PUBLIC_NATIVE_SYMBOL ??
      "INIT",
  },
  automation: {
    relayerAddress:
      process.env.NEXT_PUBLIC_AUTOMATION_RELAYER_ADDRESS ?? ZERO_ADDRESS,
    cronPath: "/api/cron/execute-dca",
  },
  submission: {
    chainId: "dripfi-1",
    executionFeeBps: 30,
    autoSignGasPrice: process.env.NEXT_PUBLIC_AUTOSIGN_GAS_PRICE ?? "0.015",
    autoExecutionPollMs: Number(process.env.NEXT_PUBLIC_AUTO_EXECUTION_POLL_MS ?? 30000),
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

export const dripfiTokenOptions = configuredTokenKeys.map((key) => dripfiConfig.tokens[key]);

export function getConfiguredToken(key: ConfiguredTokenKey) {
  return dripfiConfig.tokens[key];
}

export const prdSyncStatus = [
  {
    label: "Repo structure",
    status: "synced",
    detail: "Root repo, contracts, frontend, and .initia folder now exist.",
  },
  {
    label: "InterwovenKit",
    status: "wired",
    detail: "Provider, wallet, bridge, autosign, and identity entry points are wired in the frontend.",
  },
  {
    label: "Smart contracts",
    status: "implemented",
    detail: "DCAVault now gates execution by approved relayers, and CompoundEngine compounds into tracked principal balances.",
  },
  {
    label: "Submission assets",
    status: "partial",
    detail: "README and submission metadata now reference the public Vercel app, but final submission proof still needs live contract verification and a demo video.",
  },
];

export function isConfiguredAddress(address: string) {
  return Boolean(address) && address !== ZERO_ADDRESS;
}
