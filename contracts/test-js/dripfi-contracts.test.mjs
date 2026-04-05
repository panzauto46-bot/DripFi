import test from "node:test";
import assert from "node:assert/strict";
import ganache from "ganache";
import { ethers } from "ethers";
import { compileContracts, getArtifact } from "../script/lib/compiler.mjs";

async function deploy(factory, ...args) {
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function setupFixture() {
  const eip1193 = ganache.provider({ logging: { quiet: true } });
  const provider = new ethers.BrowserProvider(eip1193);
  const admin = await provider.getSigner(0);
  const helper = await provider.getSigner(1);
  const contracts = compileContracts();

  const mockErc20Artifact = getArtifact(contracts, "src/mocks/MockERC20.sol", "MockERC20");
  const routerArtifact = getArtifact(contracts, "src/SwapRouter.sol", "SwapRouter");
  const vaultArtifact = getArtifact(contracts, "src/DCAVault.sol", "DCAVault");
  const compoundArtifact = getArtifact(contracts, "src/CompoundEngine.sol", "CompoundEngine");

  const MockERC20Factory = new ethers.ContractFactory(
    mockErc20Artifact.abi,
    mockErc20Artifact.evm.bytecode.object,
    admin,
  );
  const RouterFactory = new ethers.ContractFactory(
    routerArtifact.abi,
    routerArtifact.evm.bytecode.object,
    admin,
  );
  const VaultFactory = new ethers.ContractFactory(
    vaultArtifact.abi,
    vaultArtifact.evm.bytecode.object,
    admin,
  );
  const CompoundFactory = new ethers.ContractFactory(
    compoundArtifact.abi,
    compoundArtifact.evm.bytecode.object,
    admin,
  );

  const usdc = await deploy(MockERC20Factory, "USD Coin", "USDC", 18);
  const initToken = await deploy(MockERC20Factory, "Initia", "INIT", 18);
  const router = await deploy(RouterFactory, await admin.getAddress());
  const vault = await deploy(
    VaultFactory,
    await admin.getAddress(),
    await router.getAddress(),
    await admin.getAddress(),
  );
  const compound = await deploy(
    CompoundFactory,
    await admin.getAddress(),
    await admin.getAddress(),
  );

  await (await router.setPairQuote(await usdc.getAddress(), await initToken.getAddress(), ethers.parseUnits("2", 18))).wait();
  await (await router.setPairQuote(await initToken.getAddress(), await usdc.getAddress(), ethers.parseUnits("0.5", 18))).wait();
  await (await initToken.mint(await router.getAddress(), ethers.parseUnits("1000000", 18))).wait();
  await (await usdc.mint(await router.getAddress(), ethers.parseUnits("1000000", 18))).wait();
  await (await usdc.mint(await admin.getAddress(), ethers.parseUnits("1000000", 18))).wait();
  await (await usdc.mint(await helper.getAddress(), ethers.parseUnits("1000", 18))).wait();
  await (await usdc.approve(await vault.getAddress(), ethers.MaxUint256)).wait();
  await (await usdc.connect(helper).approve(await vault.getAddress(), ethers.MaxUint256)).wait();

  return { provider, admin, helper, usdc, initToken, router, vault, compound };
}

test("vault supports create+fund, third-party funding, preview, execute, and owner queries", async () => {
  const { admin, helper, usdc, initToken, vault } = await setupFixture();

  const createReceipt = await (await vault.createStrategyAndFund(
    await usdc.getAddress(),
    await initToken.getAddress(),
    ethers.parseUnits("80", 18),
    24n * 60n * 60n,
    ethers.parseUnits("400", 18),
  )).wait();

  assert.ok(createReceipt, "create+fund transaction should succeed");

  const ownerStrategyIds = await vault.getStrategyIdsByOwner(await admin.getAddress());
  assert.equal(ownerStrategyIds.length, 1);

  const strategyId = ownerStrategyIds[0];
  const preview = await vault.previewExecution(strategyId);
  assert.equal(preview[0].toString(), ethers.parseUnits("79.76", 18).toString());
  assert.equal(preview[1].toString(), ethers.parseUnits("0.24", 18).toString());
  assert.equal(preview[2].toString(), ethers.parseUnits("159.52", 18).toString());

  await (await vault.connect(helper).fundStrategy(strategyId, ethers.parseUnits("50", 18))).wait();
  const funded = await vault.strategies(strategyId);
  assert.equal(funded.availableBalance.toString(), ethers.parseUnits("450", 18).toString());

  await assert.rejects(vault.connect(helper).executeOrder(strategyId));
  await (await vault.setSessionKey(await helper.getAddress(), true)).wait();

  assert.equal(await vault.canExecuteStrategy(strategyId), true);
  await (await vault.connect(helper).executeOrder(strategyId)).wait();
  assert.equal(await vault.canExecuteStrategy(strategyId), false);

  const history = await vault.getExecutionHistory(strategyId);
  assert.equal(history.length, 1);

  await (await vault.pauseStrategy(strategyId)).wait();
  const paused = await vault.strategies(strategyId);
  assert.equal(Number(paused.status), 1);

  await (await vault.resumeStrategy(strategyId)).wait();
  await (await vault.cancelStrategy(strategyId)).wait();
  const cancelled = await vault.strategies(strategyId);
  assert.equal(Number(cancelled.status), 2);
});

test("compound engine indexes positions and charges the compound fee", async () => {
  const { admin, usdc, initToken, router, compound } = await setupFixture();

  await (await initToken.approve(await compound.getAddress(), ethers.MaxUint256)).wait();
  await (await initToken.mint(await admin.getAddress(), ethers.parseUnits("100", 18))).wait();
  await (await compound.setSwapRouter(await router.getAddress())).wait();

  const registerReceipt = await (await compound.registerPosition(
    await initToken.getAddress(),
    await usdc.getAddress(),
    6n * 60n * 60n,
  )).wait();

  assert.ok(registerReceipt, "register position should succeed");

  const ids = await compound.getPositionIdsByOwner(await admin.getAddress());
  assert.equal(ids.length, 1);

  await (await compound.fundRewards(ids[0], ethers.parseUnits("10", 18))).wait();
  await (await compound.compound(ids[0])).wait();

  const position = await compound.positions(ids[0]);
  assert.equal(position.compoundedAmount.toString(), ethers.parseUnits("4.75", 18).toString());
  assert.equal(position.principalBalance.toString(), ethers.parseUnits("4.75", 18).toString());
});
