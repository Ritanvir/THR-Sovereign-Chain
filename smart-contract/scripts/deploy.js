const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("Missing RPC_URL or PRIVATE_KEY in .env");
  }

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "THRAnchor.sol",
    "THRAnchor.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  console.log("Deploying contract...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CONTRACT_ADDRESS=", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});