import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";
import { compileContracts, getArtifact, getContractsRoot } from "./lib/compiler.mjs";

const contractsRoot = getContractsRoot();
const deploymentsDir = path.join(contractsRoot, "deployments");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function toUnits(value) {
  return ethers.parseUnits(value, 18);
}

async function deploy(factory, ...args) {
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

function upsertEnvFile(envPath, nextEntries) {
  const existing = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    : [];

  const map = new Map();
  for (const line of existing) {
    if (!line || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    map.set(key, rest.join("="));
  }

  for (const [key, value] of Object.entries(nextEntries)) {
    map.set(key, value);
  }

  const output = [...map.entries()].map(([key, value]) => `${key}=${value}`).join("\n");
  fs.writeFileSync(envPath, `${output}\n`);
}

async function main() {
  const rpcUrl = requireEnv("JSON_RPC_URL");
  const privateKey = requireEnv("PRIVATE_KEY");
  const appchainId = process.env.APPCHAIN_ID ?? "dripfi-1";
  const restUrl = process.env.REST_URL ?? "https://rest.testnet.initia.xyz";
  const rpcNodeUrl = process.env.RPC_URL ?? "https://rpc.testnet.initia.xyz";
  const indexerUrl = process.env.INDEXER_URL ?? "https://indexer.testnet.initia.xyz";
  const feeRecipient = process.env.FEE_RECIPIENT;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const network = await provider.getNetwork();
  const owner = wallet.address;

  const contracts = compileContracts();

  const mockErc20Artifact = getArtifact(contracts, "src/mocks/MockERC20.sol", "MockERC20");
  const routerArtifact = getArtifact(contracts, "src/SwapRouter.sol", "SwapRouter");
  const vaultArtifact = getArtifact(contracts, "src/DCAVault.sol", "DCAVault");
  const compoundArtifact = getArtifact(
    contracts,
    "src/CompoundEngine.sol",
    "CompoundEngine",
  );

  const MockERC20Factory = new ethers.ContractFactory(
    mockErc20Artifact.abi,
    mockErc20Artifact.evm.bytecode.object,
    wallet,
  );
  const RouterFactory = new ethers.ContractFactory(
    routerArtifact.abi,
    routerArtifact.evm.bytecode.object,
    wallet,
  );
  const VaultFactory = new ethers.ContractFactory(
    vaultArtifact.abi,
    vaultArtifact.evm.bytecode.object,
    wallet,
  );
  const CompoundFactory = new ethers.ContractFactory(
    compoundArtifact.abi,
    compoundArtifact.evm.bytecode.object,
    wallet,
  );

  const usdc = await deploy(MockERC20Factory, "USD Coin", "USDC", 18);
  const initToken = await deploy(MockERC20Factory, "Initia", "INIT", 18);
  const swapRouter = await deploy(RouterFactory, owner);
  const dcaVault = await deploy(
    VaultFactory,
    owner,
    await swapRouter.getAddress(),
    feeRecipient ?? owner,
  );
  const compoundEngine = await deploy(CompoundFactory, owner, feeRecipient ?? owner);

  await (await swapRouter.setPairQuote(await usdc.getAddress(), await initToken.getAddress(), toUnits("2"))).wait();
  await (await initToken.mint(await swapRouter.getAddress(), toUnits("1000000"))).wait();
  await (await usdc.mint(owner, toUnits("1000000"))).wait();

  fs.mkdirSync(deploymentsDir, { recursive: true });

  const deployment = {
    deployedAt: new Date().toISOString(),
    appchainId,
    evmChainId: Number(network.chainId),
    rpcUrl,
    owner,
    feeRecipient: feeRecipient ?? owner,
    contracts: {
      usdc: await usdc.getAddress(),
      initToken: await initToken.getAddress(),
      swapRouter: await swapRouter.getAddress(),
      dcaVault: await dcaVault.getAddress(),
      compoundEngine: await compoundEngine.getAddress(),
    },
  };

  const deploymentPath = path.join(deploymentsDir, `${appchainId}.json`);
  fs.writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  const shouldExportAppEnv =
    process.argv.includes("--export-frontend") ||
    process.argv.includes("--export-root-env") ||
    process.env.EXPORT_FRONTEND_ENV === "true" ||
    process.env.EXPORT_ROOT_ENV === "true";

  if (shouldExportAppEnv) {
    const appEnvPath = path.resolve(contractsRoot, "..", ".env.local");
    upsertEnvFile(appEnvPath, {
      NEXT_PUBLIC_APPCHAIN_ID: appchainId,
      NEXT_PUBLIC_RPC_URL: rpcNodeUrl,
      NEXT_PUBLIC_REST_URL: restUrl,
      NEXT_PUBLIC_INDEXER_URL: indexerUrl,
      NEXT_PUBLIC_JSON_RPC_URL: rpcUrl,
      NEXT_PUBLIC_DCA_VAULT_ADDRESS: deployment.contracts.dcaVault,
      NEXT_PUBLIC_SWAP_ROUTER_ADDRESS: deployment.contracts.swapRouter,
      NEXT_PUBLIC_COMPOUND_ENGINE_ADDRESS: deployment.contracts.compoundEngine,
      NEXT_PUBLIC_USDC_ADDRESS: deployment.contracts.usdc,
      NEXT_PUBLIC_INIT_TOKEN_ADDRESS: deployment.contracts.initToken,
    });
    console.log(`Updated root app env at ${appEnvPath}`);
  }

  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
