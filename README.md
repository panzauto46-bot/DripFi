# DripFi

Automated DCA and auto-compound protocol concept for Initia.

This repository is structured to match the DripFi PRD and now includes:

- root Next.js app: landing page and dashboard route for the Vercel deployment target
- `contracts/`: Solidity contracts for the DCA vault, swap router, and compound engine
- `.initia/submission.json`: local submission scaffold for hackathon packaging
- `foundry.toml`: Foundry configuration aligned with the `contracts/` layout
- `contracts/package.json`: Node-based compile, test, and deploy tooling for environments where Foundry is not installed

## Current Scope

The repository now reflects the PRD at the scaffold and local-demo level:

- Root app MVP screens exist for wallet onboarding, strategy creation, dashboard monitoring, and PRD sync status
- InterwovenKit provider wiring is included so wallet, bridge, autosign, and `.init` identity flows can be connected from the UI
- Solidity contracts, local Node-based contract tests, and deploy scripts are included for the DCA protocol core

The remaining work before a final hackathon submission is still deployment and live integration:

- deploy contracts on an Initia MiniEVM appchain
- set real contract addresses and chain endpoints in root app env vars
- verify live wallet, bridge, and autosign flows against the deployed appchain
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
- `NEXT_PUBLIC_BRIDGE_SRC_CHAIN_ID`
- `NEXT_PUBLIC_BRIDGE_SRC_DENOM`

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
