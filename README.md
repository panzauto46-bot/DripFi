# DripFi

Automated DCA and auto-compound protocol concept for Initia.

Public frontend:

- `https://drip-fi.vercel.app`

This repository is structured to match the DripFi PRD and now includes:

- root Next.js app: landing page and dashboard route for the Vercel deployment target
- `contracts/`: Solidity contracts for the DCA vault, swap router, and compound engine
- `src/app/api/cron/execute-dca`: server-side executor for due strategies
- `vercel.json`: scheduled cron wiring for background execution
- `.initia/submission.json`: local submission scaffold for hackathon packaging
- `foundry.toml`: Foundry configuration aligned with the `contracts/` layout
- `contracts/package.json`: Node-based compile, test, and deploy tooling for environments where Foundry is not installed

## Current Scope

The repository now reflects the PRD at the public frontend plus live-integration-ready level:

- Root app MVP screens exist for wallet onboarding, strategy creation, dashboard monitoring, and PRD sync status
- InterwovenKit provider wiring is included so wallet, bridge, autosign, and `.init` identity flows can be connected from the UI
- Solidity contracts, local Node-based contract tests, and deploy scripts are included for the DCA protocol core
- Background execution is now supported through a relayer-backed Vercel cron route once env vars are configured

The remaining work before a final hackathon submission is still deployment and live integration:

- deploy contracts on an Initia MiniEVM appchain
- set real contract addresses and chain endpoints in root app env vars
- set the automation relayer env vars in Vercel so due strategies can execute after the tab closes
- verify live wallet, bridge, autosign, and background execution flows against the deployed appchain
- record the demo video and finalize public deployment

## Repository Layout

```text
DripFi/
├── .initia/
│   └── submission.json
├── contracts/
│   ├── src/
│   │   ├── interfaces/
│   │   ├── libraries/
│   │   ├── mocks/
│   │   ├── CompoundEngine.sol
│   │   ├── DCAVault.sol
│   │   └── SwapRouter.sol
│   └── test/
│       └── DCAVault.t.sol
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
├── package.json
├── DripFi_PRD_EN.md
├── README.md
└── foundry.toml
```

## Frontend Setup

```powershell
cd <repo-root>
copy .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Open:

- `http://127.0.0.1:3000`
- `http://127.0.0.1:3000/dashboard`

## Frontend Env

These values can be configured in `.env.local` at the repo root:

- `NEXT_PUBLIC_APPCHAIN_ID`
- `NEXT_PUBLIC_CHAIN_NAME`
- `NEXT_PUBLIC_CHAIN_PRETTY_NAME`
- `NEXT_PUBLIC_NATIVE_DENOM`
- `NEXT_PUBLIC_NATIVE_SYMBOL`
- `NEXT_PUBLIC_NATIVE_DECIMALS`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_REST_URL`
- `NEXT_PUBLIC_INDEXER_URL`
- `NEXT_PUBLIC_JSON_RPC_URL`
- `NEXT_PUBLIC_DCA_VAULT_ADDRESS`
- `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS`
- `NEXT_PUBLIC_COMPOUND_ENGINE_ADDRESS`
- `NEXT_PUBLIC_USDC_ADDRESS`
- `NEXT_PUBLIC_USDC_DECIMALS`
- `NEXT_PUBLIC_INIT_TOKEN_ADDRESS`
- `NEXT_PUBLIC_INIT_TOKEN_DECIMALS`
- `NEXT_PUBLIC_BRIDGE_SRC_CHAIN_ID`
- `NEXT_PUBLIC_BRIDGE_SRC_DENOM`
- `NEXT_PUBLIC_BRIDGE_DST_DENOM`
- `NEXT_PUBLIC_BRIDGE_ASSET_SYMBOL`
- `NEXT_PUBLIC_AUTOMATION_RELAYER_ADDRESS`

Server-only env values used by the cron executor:

- `AUTOMATION_RELAYER_PRIVATE_KEY`
- `AUTOMATION_MAX_EXECUTIONS_PER_RUN`
- `CRON_SECRET`

## Automation Executor

Background execution is exposed at `GET /api/cron/execute-dca` and scheduled via `vercel.json`.

To make it live on Vercel:

1. Add `NEXT_PUBLIC_AUTOMATION_RELAYER_ADDRESS` to the project env vars.
2. Add the matching `AUTOMATION_RELAYER_PRIVATE_KEY` to the project env vars.
3. Set `CRON_SECRET` so the cron route cannot be triggered publicly.
4. Ensure each user enables automation in the dashboard so the relayer is approved through `setSessionKey`.

## Contracts Setup

You can use either Foundry or the bundled Node-based toolchain.

### Option A: Foundry

Install Foundry, then run:

```powershell
forge build
forge test
```

### Option B: Bundled Node Tooling

```powershell
cd <repo-root>\contracts
copy .env.example .env
npm.cmd install
npm.cmd run build
npm.cmd run test
```

To deploy with the Node script:

```powershell
cd <repo-root>\contracts
$env:JSON_RPC_URL="https://your-minievm-json-rpc"
$env:PRIVATE_KEY="0x..."
$env:APPCHAIN_ID="dripfi-1"
$env:EXPORT_ROOT_ENV="true"
npm.cmd run deploy -- --export-root-env
```

This deploy flow writes a deployment manifest into `contracts/deployments/` and can update the root `.env.local` automatically.

## PRD Sync

The source PRD lives at `./DripFi_PRD_EN.md`. It includes a sync snapshot that matches the repository state created in this scaffold.
