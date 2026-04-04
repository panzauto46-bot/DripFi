import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractsRoot = path.resolve(__dirname, "..", "..");
const srcDir = path.join(contractsRoot, "src");

function walkSolidityFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkSolidityFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".sol")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeKey(filePath) {
  return path.relative(contractsRoot, filePath).replaceAll("\\", "/");
}

export function compileContracts() {
  const sources = Object.fromEntries(
    walkSolidityFiles(srcDir).map((filePath) => [
      normalizeKey(filePath),
      { content: fs.readFileSync(filePath, "utf8") },
    ]),
  );

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors ?? [];
  const fatalErrors = errors.filter((item) => item.severity === "error");

  if (fatalErrors.length > 0) {
    const message = fatalErrors.map((item) => item.formattedMessage).join("\n\n");
    throw new Error(message);
  }

  return output.contracts ?? {};
}

export function getArtifact(contracts, sourceName, contractName) {
  const sourceContracts = contracts[sourceName];
  if (!sourceContracts || !sourceContracts[contractName]) {
    throw new Error(`Artifact not found for ${sourceName}:${contractName}`);
  }
  return sourceContracts[contractName];
}

export function getContractsRoot() {
  return contractsRoot;
}
