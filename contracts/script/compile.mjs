import fs from "node:fs";
import path from "node:path";
import { compileContracts, getContractsRoot } from "./lib/compiler.mjs";

const contractsRoot = getContractsRoot();
const outDir = path.join(contractsRoot, "out");

fs.mkdirSync(outDir, { recursive: true });

const contracts = compileContracts();
const manifest = {};

for (const [sourceName, sourceContracts] of Object.entries(contracts)) {
  for (const [contractName, artifact] of Object.entries(sourceContracts)) {
    const filename = `${contractName}.json`;
    const outputPath = path.join(outDir, filename);
    const serialized = {
      sourceName,
      contractName,
      abi: artifact.abi,
      bytecode: artifact.evm.bytecode.object,
      deployedBytecode: artifact.evm.deployedBytecode.object,
    };

    fs.writeFileSync(outputPath, `${JSON.stringify(serialized, null, 2)}\n`);
    manifest[contractName] = {
      sourceName,
      artifact: `out/${filename}`,
    };
  }
}

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Compiled ${Object.keys(manifest).length} contracts into ${outDir}`);
