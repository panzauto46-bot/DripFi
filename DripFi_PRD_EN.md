# DripFi - Product Requirements Document (PRD)
**Automated DCA & Auto-Compound Protocol on Initia**

> "Set it, forget it, profit."

---

## General Information

| | |
|---|---|
| **Product Name** | DripFi |
| **Hackathon** | INITIATE: The Initia Hackathon (Season 1) |
| **Track** | DeFi |
| **Submission Deadline** | April 16, 2026 |
| **Estimated Build Time** | 10 days |
| **Revenue Model** | 0.3% fee per executed order |
| **Target Prize** | $25,000 USD (pool) |

---

## 1. Product Summary

DripFi is a DeFi protocol built on top of an Initia Appchain that enables users to perform **automated Dollar Cost Averaging (DCA)** and **auto-compound yield** without needing to manually approve transactions every time.

A single setup is all it takes - funds automatically "drip" into positions on a user-defined schedule: hourly, daily, or weekly.

**Core value proposition:** Leverage Initia's Auto-signing feature -> users DCA every hour/day/week without ever opening their wallet again. This is what sets DripFi apart from every DCA protocol on other chains.

**One-line pitch for judges:**
> *"DripFi is the only truly hands-free DCA protocol on Initia - because only Initia has Auto-signing."*

---

## 2. Problem Statement

### Current Problems

| Problem | Detail |
|---|---|
| Manual DCA is exhausting | Open exchange, approve, buy, repeat. Highly inefficient and easy to forget. |
| Cross-chain bridging is painful | Users must manually bridge from other chains - costly, and many give up before even starting. |
| Yield is never compounded | LP rewards accumulate but are never reinvested -> effective APY is far lower than advertised. |
| No social layer | Great strategies can't be easily shared with the community. |

### DripFi Solutions

| Problem | DripFi Solution |
|---|---|
| Manual DCA | Initia Auto-signing -> automated execution in the background, one setup runs forever |
| Painful bridging | Interwoven Bridge -> deposit from any chain directly into DripFi, one click |
| Yield not compounded | CompoundEngine -> automatically claims & reinvests at every interval |
| No social layer | Share strategies via Initia Username (.init) -> copy a strategy with one click |

---

## 3. Initia Native Features (Hackathon Requirements)

DripFi satisfies **all three mandatory requirements** from the organizers simultaneously:

### 3.1 Auto-signing / Session UX
The core feature of DripFi. Users approve once at setup (session key), then DCA runs automatically at every interval without further approvals. This is what makes DripFi feel like "magic" - and it cannot be replicated on other chains without a centralized backend.

### 3.2 Interwoven Bridge
Users can deposit their DCA capital from Ethereum, BSC, or any other Cosmos chain directly into DripFi without needing to understand bridging. Onboarding becomes seamless and the barrier to entry drops dramatically.

### 3.3 Initia Usernames (.init)
Users can share their DCA strategies with friends via human-readable usernames (for example `pandu.init`). A compelling social layer for viral growth and differentiation from competing protocols.

---

## 4. Product Features

### MVP (Must Have)

| Feature | Description |
|---|---|
| **DCA Scheduler** | Choose token pair, amount per order, and interval (hourly / daily / weekly). Smart contract executes automatically via session key. |
| **Cross-chain Deposit** | Fund a strategy directly from an ETH/BSC wallet via Interwoven Bridge. No chain-hopping required. |
| **Strategy Dashboard** | View DCA progress, average buy price, total invested, current value, and real-time PnL in one screen. |
| **Pause / Resume / Stop** | Users can pause a strategy at any time, resume it, or stop it and safely withdraw remaining funds. |
| **Wallet Connect** | Full integration via `@initia/interwovenkit-react`. |

### Nice-to-Have (Time Permitting)

| Feature | Description |
|---|---|
| **Auto-Compound** | LP position yield is automatically compounded back into the same position. Effective APY increases with no manual action. |
| **Social Strategy Share** | Publish a strategy publicly via `.init` username. Followers can copy it with one click. |
| **Strategy Templates** | Ready-to-use strategy templates: "Safe DCA", "Aggressive DCA", "Yield Compounder". |

---

## 5. Revenue Model

| Source | Mechanism | Priority |
|---|---|---|
| Execution fee | 0.3% of every DCA order executed | Primary |
| Compound fee | 5% of yield automatically compounded | Secondary |
| Premium strategies | Access to advanced strategies (grid DCA, value averaging) | Future |

> Revenue is captured directly on the appchain - no value leaks to external sequencers or third parties. Fully aligned with Initia's narrative of *"no unnecessary value leakage."*

---

## 6. Tech Stack

### Smart Contracts
- **VM:** EVM (Solidity) - most familiar, mature tooling
- **Framework:** Foundry (Forge) for development & testing
- **Contracts:**
  - `DCAVault.sol` - core DCA strategy logic
  - `SwapRouter.sol` - interface to the DEX on the appchain
  - `CompoundEngine.sol` - auto-compound yield (optional for MVP)

### Frontend
- React / Next.js
- `@initia/interwovenkit-react` - wallet connect + transactions
- Tailwind CSS
- ethers.js

### Initia Integration
- Session Key (auto-sign) via InterwovenKit
- Interwoven Bridge SDK
- Initia Username (.init) resolver

### Infrastructure
- `weave` CLI - appchain setup & management
- OPinit Executor - handles OP bridge operations
- IBC Relayer (Docker) - cross-chain communication
- Vercel - frontend deployment

---

## 7. Smart Contract Architecture

### DCAVault.sol (Core)
```text
Main functions:
- createStrategy(tokenIn, tokenOut, amount, interval) -> create a new DCA strategy
- executeOrder(strategyId) -> called by Keeper/bot at every interval
- cancelStrategy(strategyId) -> cancel and return funds
- withdrawFunds(strategyId) -> withdraw remaining balance
- pauseStrategy(strategyId) / resumeStrategy(strategyId)

Storage:
- mapping strategyId -> StrategyConfig
- mapping strategyId -> ExecutionHistory[]
- Session key per user
```

### SwapRouter.sol
```text
Main functions:
- swap(tokenIn, tokenOut, amountIn) -> execute a swap
- getAmountOut(tokenIn, tokenOut, amountIn) -> preview price

Interface to a simple constant-product AMM on the appchain
```

### CompoundEngine.sol (Optional)
```text
Main functions:
- compound(positionId) -> claim rewards and reinvest
- setCompoundInterval(interval) -> configure compound frequency
```

---

## 8. User Journey

```text
1. User opens DripFi -> connects wallet via InterwovenKit
2. User deposits USDC from any chain via Interwoven Bridge
3. User creates a DCA strategy:
   - Choose target token (for example INIT)
   - Set amount per order (for example $10)
   - Set interval (for example daily)
4. User approves session key once
5. DripFi automatically buys $10 worth of INIT every day
6. User monitors dashboard: average price, total INIT held, PnL
7. User can pause/stop at any time and withdraw funds
```

---

## 9. 10-Day Build Plan

| Day | Task |
|---|---|
| **Day 1-2** | Set up Initia Appchain (EVM track) + deploy to testnet + verify valid chain ID |
| **Day 3-4** | Develop `DCAVault.sol` + `SwapRouter.sol` + unit tests with Foundry |
| **Day 5-6** | Build React frontend + integrate InterwovenKit + session key flow |
| **Day 7** | Integrate Interwoven Bridge + Initia Username resolver |
| **Day 8** | End-to-end testing + bug fixing + UI polish |
| **Day 9** | Record demo video + write README + create `submission.json` |
| **Day 10** | Buffer / final polish / submit before April 16 deadline |

---

## 10. Scoring vs. Judging Criteria

| Criteria | Weight | DripFi Strength | Target Score |
|---|---|---|---|
| Technical Execution + Initia Integration | 30% | Uses all 3 native features, EVM is familiar territory | High |
| Product Value & UX | 20% | DCA is a real use case, not an empty demo | High |
| Working Demo & Completeness | 20% | Achievable in 10 days with focus | Medium-High |
| Originality & Track Fit | 20% | DCA + auto-sign = unique combination on Initia | High |
| Market Understanding | 10% | Target: crypto holders who want passive DCA | Medium |

---

## 11. Submission Checklist

- [ ] Valid rollup chain ID (`dripfi-1`)
- [ ] InterwovenKit used for wallet connect & transactions
- [ ] Auto-signing / session key implemented
- [ ] Interwoven Bridge integrated
- [ ] Initia Username (.init) utilized
- [ ] `.initia/submission.json` present at repo root
- [ ] `README.md` complete (description, how to run, key features)
- [ ] Demo video (end-to-end: setup DCA -> automatic execution -> dashboard)
- [ ] Smart contracts deployed on testnet
- [ ] Frontend publicly accessible

---

## 12. Recommended Repository Structure

```text
dripfi/
├── .initia/
│   └── submission.json          <- required
├── contracts/
│   ├── src/
│   │   ├── interfaces/
│   │   ├── libraries/
│   │   ├── mocks/
│   │   ├── DCAVault.sol
│   │   ├── SwapRouter.sol
│   │   └── CompoundEngine.sol
│   └── test/
│       └── DCAVault.t.sol
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
├── README.md                    <- required
└── foundry.toml
```

---

## 13. Target Users

**Primary:** Retail crypto holders who want to invest regularly into Initia ecosystem tokens without the hassle of manually opening an exchange every day.

**Secondary:** DeFi power users who want to automate compounding of their LP yield positions.

**Core pain point:** *"I know DCA is the smart move, but I always forget or can't be bothered to execute it manually."*

---

## 14. Competitive Landscape

| Protocol | Chain | DCA? | Auto-sign? | Cross-chain Deposit? |
|---|---|---|---|---|
| DripFi | Initia | Yes | Yes (native) | Yes (Interwoven) |
| Mean Finance | Arbitrum | Yes | No | No |
| DCA.Monster | BSC | Yes | No | No |
| Kamino | Solana | Partial | No | No |

**Competitive edge:** DripFi is the only DCA protocol that is truly hands-free, thanks to Initia's native Auto-signing. No centralized backend is needed to trigger transactions - it's fully on-chain.

---

## 15. Implementation Sync Snapshot (April 4, 2026)

This PRD is synchronized with the current local repository scaffold:

| Area | Status | Notes |
|---|---|---|
| Frontend landing page | Scaffolded | Judge-facing product pitch now lives in the Next.js app |
| Frontend dashboard page | Live-ready locally | Strategy composer, wallet panel, autosign controls, and strategy action buttons are wired for real MiniEVM `MsgCall` flows once addresses are configured |
| InterwovenKit integration | Wired | Provider, wallet connect, bridge entry, username identity, and MiniEVM autosign flows are included in the frontend |
| Smart contracts | Implemented + tested locally | `DCAVault.sol`, `SwapRouter.sol`, `CompoundEngine.sol`, and local contract tests now cover create/fund/execute/pause/resume/stop and compound fee behavior |
| `.initia/submission.json` | Present | Local scaffold exists and still needs final schema verification before submission |
| README | Present | Root and frontend README files now describe the repo layout, contract tooling, and deploy flow |
| Testnet deployment | Pending | Contract deployment and live chain verification still require a target MiniEVM JSON-RPC endpoint plus deployer credentials |
| Demo video | Pending | Not yet produced |

### Important clarification

The repository now matches the PRD at the **scaffold and local demo level**, but not yet at the **fully deployed hackathon submission level**. Live chain addresses, testnet deployment proof, public frontend hosting, and the final demo video are still outstanding.

---

*This document was created for the INITIATE: The Initia Hackathon (Season 1)*  
*Deadline: April 16, 2026 | Track: DeFi | Chain: Initia*
