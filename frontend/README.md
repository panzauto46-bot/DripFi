# DripFi Frontend

Next.js frontend for the DripFi MVP scaffold.

## What is included

- landing route at `/`
- dashboard route at `/dashboard`
- InterwovenKit provider wiring for wallet connect, bridge entry, and autosign-ready MiniEVM calls
- strategy composer UI that prepares a `createStrategy` transaction payload for `DCAVault`

## Local setup

```powershell
copy .env.example .env.local
npm.cmd install
npm.cmd run dev
```

## Required envs for live chain mode

- `NEXT_PUBLIC_APPCHAIN_ID`
- `NEXT_PUBLIC_DCA_VAULT_ADDRESS`
- `NEXT_PUBLIC_USDC_ADDRESS`
- `NEXT_PUBLIC_INIT_TOKEN_ADDRESS`
- `NEXT_PUBLIC_JSON_RPC_URL`

If those values are not configured, the UI still runs in local scaffold mode and explains what is missing.
