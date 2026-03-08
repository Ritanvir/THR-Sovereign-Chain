const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const EVENT_TYPES = {
  registration: 0,
  transfer: 1,
  mortgage: 2,
  encumbrance: 3,
  mutation: 4,
};

function sha256Buffer(buffer) {
  return "0x" + crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return "0x" + crypto.createHash("sha256").update(text).digest("hex");
}

function getContract() {
  const artifactPath = path.join(
    __dirname,
    "..",
    "smart-contract",
    "artifacts",
    "contracts",
    "THRAnchor.sol",
    "THRAnchor.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  return new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    artifact.abi,
    wallet
  );
}

app.get("/health", async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const blockNumber = await provider.getBlockNumber();

    res.json({
      ok: true,
      rpcUrl: process.env.RPC_URL,
      blockNumber,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/anchor-file", upload.single("document"), async (req, res) => {
  try {
    const { recordReference, eventType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "document file is required" });
    }

    if (!recordReference || !eventType) {
      return res
        .status(400)
        .json({ error: "recordReference and eventType are required" });
    }

    const normalizedEventType = String(eventType).toLowerCase();
    if (EVENT_TYPES[normalizedEventType] === undefined) {
      return res.status(400).json({ error: "invalid eventType" });
    }

    const documentHash = sha256Buffer(req.file.buffer);
    const recordRefHash = sha256Text(recordReference);

    const contract = getContract();
    const nextAnchorId = await contract.nextAnchorId();

    const tx = await contract.createAnchor(
      documentHash,
      recordRefHash,
      EVENT_TYPES[normalizedEventType]
    );

    const receipt = await tx.wait();

    res.json({
      success: true,
      anchorId: nextAnchorId.toString(),
      documentHash,
      recordRefHash,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/verify-file", upload.single("document"), async (req, res) => {
  try {
    const { anchorId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "document file is required" });
    }

    if (anchorId === undefined || anchorId === null || anchorId === "") {
      return res.status(400).json({ error: "anchorId is required" });
    }

    const contract = getContract();
    const anchor = await contract.getAnchor(anchorId);

    const computedHash = sha256Buffer(req.file.buffer);
    const onChainHash = anchor.documentHash;

    const isValid =
      String(computedHash).toLowerCase() === String(onChainHash).toLowerCase();

    res.json({
      success: true,
      anchorId: anchor.anchorId.toString(),
      computedHash,
      onChainHash,
      isValid,
      timestamp: anchor.timestamp.toString(),
      submittedBy: anchor.submittedBy,
      recordRefHash: anchor.recordRefHash,
      eventType: anchor.eventType.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});