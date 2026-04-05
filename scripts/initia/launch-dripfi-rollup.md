# DripFi Initia Rollup Guide

This guide is the fastest path from the current Windows machine to a DripFi appchain that strengthens the hackathon submission.

## Windows status already prepared

- WSL runtime package installed
- Ubuntu 24.04 package installed
- Docker Desktop installed
- Go installed on Windows

One system reboot is still required before Ubuntu can finish its first launch.

## After the reboot

1. Open Docker Desktop and wait until it is fully running.
2. Run the post-reboot checker:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/initia/windows-post-reboot-check.ps1
```

3. Start Ubuntu once and create your Linux username and password:

```powershell
ubuntu2404.exe
```

4. Enter the repo from WSL:

```powershell
wsl -d Ubuntu-24.04 --cd /mnt/e/DripFi
```

5. Bootstrap the Linux-side tooling:

```bash
bash scripts/initia/bootstrap-wsl.sh
```

## Launch the DripFi rollup

Run:

```bash
weave init
weave rollup launch
```

Use these DripFi-specific answers where the interactive flow asks for values:

- Action: `Launch a new rollup`
- L1 network: `Testnet (initiation-2)`
- VM: `EVM`
- Rollup chain ID: `dripfi-1`
- Rollup gas denom: keep the default unless the CLI recommends another value
- Rollup node moniker: `dripfi-operator`
- Submission interval: keep the default `1m`
- Finalization period: keep the default `168h`
- Data availability: `Initia L1`
- Oracle price feed: `Enable`
- System keys: `Generate new system keys`
- Funding preset: `Use the default preset`
- Fee whitelist: leave empty
- Add gas station account to genesis: `Yes`
- Genesis balance for gas station: use the EVM-safe value shown by the CLI

## Start the infrastructure bots

Run:

```bash
weave opinit init executor
weave opinit start executor -d
weave relayer init
weave relayer start -d
```

Prefer these answers:

- Use detected keys: `Yes`
- Pre-fill from config: `Yes`
- Relayer rollup type: `Local Rollup (dripfi-1)`
- Channel setup: `Subscribe to only transfer and nft-transfer IBC Channels`
- Challenger key: `Yes`

## Contract deployment and frontend wiring

Once the rollup is running, deploy the contracts from the repo's bundled Node tooling:

```powershell
cd contracts
copy .env.example .env
```

Set at least:

- `JSON_RPC_URL` to the MiniEVM endpoint exposed by your rollup
- `PRIVATE_KEY` to the deployer wallet
- `APPCHAIN_ID=dripfi-1`

Then deploy:

```powershell
npm.cmd install
npm.cmd run deploy -- --export-root-env
```

That writes deployment files under `contracts/deployments/` and can update the root `.env.local`.

## Update the root frontend env

If you want to set the values manually:

- `NEXT_PUBLIC_JSON_RPC_URL`
- `NEXT_PUBLIC_DCA_VAULT_ADDRESS`
- `NEXT_PUBLIC_SWAP_ROUTER_ADDRESS`
- `NEXT_PUBLIC_COMPOUND_ENGINE_ADDRESS`
- `NEXT_PUBLIC_USDC_ADDRESS`
- `NEXT_PUBLIC_INIT_TOKEN_ADDRESS`
- `NEXT_PUBLIC_AUTOMATION_RELAYER_ADDRESS`

Or use the helper script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/initia/set-live-env.ps1
```
