# THR Sovereign Blockchain Integrity Layer

## Overview

This project implements a **sovereign, permissioned blockchain integrity layer** for the **Trust Hub Registry (THR)**, the legally recognized land registry system.

The blockchain does **not replace THR**. THR remains the **official system of record**.  
The blockchain acts as an **immutable notarization and integrity layer** for registry events and documents.

The solution is designed as a **containerized microservice architecture** hosted on **Microsoft Azure** and built with:

- **Frontend**: Node.js-based web application
- **Backend / Notarization Service**: Node.js service
- **Blockchain**: Hyperledger Besu
- **Consensus**: QBFT
- **Contract**: Solidity smart contract deployed on Besu
- **Communication**:
  - Frontend -> Backend via **REST API**
  - Backend -> Besu via **JSON-RPC**

## Business Goal

The purpose of the system is to improve:

- document integrity
- tamper-proof timestamping
- auditability
- cyber resilience
- trust in land registration processes

The blockchain stores **proofs**, not full registry records.

## Core Principle

- **THR remains the legal and authoritative registry**
- **Blockchain stores immutable proof of registry events**
- **Original documents remain off-chain**
- **Hashes and transaction references are stored on-chain**

## Final Simplified Architecture

```text
User
  -> Frontend
  -> Backend / Notarization Service
  -> Besu JSON-RPC
  -> Smart Contract on Besu
  -> Blockchain receipt back to Backend
  -> TxID / status mapped back to THR
```

### Technology Flow

- **User interacts with frontend**
- **Frontend calls backend through REST APIs**
- **Backend performs notarization logic**
- **Backend sends blockchain transactions to Besu using JSON-RPC**
- **Smart contract stores immutable proof**
- **Backend stores or maps transaction details back to THR**

## System Components

### 1. Frontend
The frontend is the user-facing application.

Responsibilities:
- collect user input
- upload document or registry data
- trigger anchoring / verification requests
- display transaction status and verification results

The frontend does **not** talk directly to the blockchain.

### 2. Backend / Notarization Service
This is the core integration layer of the system.

Responsibilities:
- receive requests from frontend or THR
- validate input
- canonicalize data
- generate SHA-256 hashes
- enforce idempotency
- build blockchain payloads
- submit transactions to Besu
- handle retries and errors
- retrieve receipts
- map blockchain TxID / block info back to THR or application records

This backend is the **custom integration layer / middleware** described in the architecture.

### 3. Hyperledger Besu Network
A private, permissioned blockchain network.

Responsibilities:
- maintain immutable ledger
- process transactions
- run QBFT consensus
- finalize blocks
- provide JSON-RPC interface to backend

### 4. Smart Contract
The smart contract is deployed on Besu and stores notarization proof.

Typical on-chain fields:
- document hash
- record reference hash
- event type
- timestamp
- submitter address
- anchor ID

The contract stores **proof metadata only**, not full documents.

## Communication Model

### Frontend -> Backend
Communication type: **REST API**

Example endpoints:
- `POST /anchor-file`
- `POST /verify-file`
- `GET /health`

Why REST:
- simple for browser-based UI
- easy to debug
- easy to integrate
- suitable for file upload and standard app workflows

### Backend -> Besu
Communication type: **JSON-RPC**

Example methods:
- `eth_blockNumber`
- `eth_call`
- `eth_sendRawTransaction`
- `eth_getTransactionReceipt`

Why JSON-RPC:
- Besu exposes standard Ethereum-compatible JSON-RPC interfaces
- libraries such as `ethers.js` use JSON-RPC under the hood

## ABI vs JSON-RPC

These are not the same thing.

### ABI
The ABI defines:
- available smart contract functions
- input types
- output types
- event structure
- encoding/decoding rules

### JSON-RPC
JSON-RPC is the communication interface used to send encoded requests to a Besu node.

In simple terms:

- **ABI = contract language/format**
- **JSON-RPC = communication channel to the blockchain node**

Both are required.

## Data Processing Lifecycle

### Anchor Flow

1. User submits a document or event through the frontend
2. Frontend sends request to backend
3. Backend validates request
4. Backend canonicalizes the input
5. Backend generates SHA-256 hash
6. Backend checks idempotency
7. Backend prepares and signs blockchain transaction
8. Backend sends transaction to Besu through JSON-RPC
9. Besu validator nodes finalize the block using QBFT
10. Backend receives transaction receipt
11. Backend stores/maps TxID, block number, and status back to THR or application storage
12. Frontend receives success response

### Verify Flow

1. User submits document or record reference
2. Backend canonicalizes or hashes the input again
3. Backend reads on-chain proof using Besu JSON-RPC
4. Backend compares on-chain hash with computed hash
5. Backend returns verification result to frontend

## Canonicalization

Canonicalization is the process of converting registry data into a **deterministic, normalized format** before hashing.

Why it matters:
- the same logical record can appear in different textual or formatting forms
- without canonicalization, semantically identical records may produce different hashes

Typical canonicalization rules:
- normalize field order
- trim extra spaces
- standardize date format
- normalize case
- normalize number formatting
- enforce UTF-8 encoding
- apply consistent null/empty value handling

Canonicalization happens in the **backend/notarization service before hashing**.

## SHA-256 Hashing

The system uses SHA-256 to generate cryptographic fingerprints of documents or canonical records.

Hashing is used for:
- integrity verification
- tamper detection
- immutable proof anchoring

The blockchain stores the resulting hashes, not the original document content.

## Idempotency

Idempotency prevents duplicate blockchain submissions for the same logical event.

Example:
- if the same THR event is accidentally submitted twice
- the backend should detect it and avoid creating duplicate anchors

This is handled in the backend layer.

## Retry and Error Handling

Retry and error governance should also be handled in the backend service.

Examples:
- temporary Besu node unavailability
- network timeout
- delayed transaction confirmation
- duplicate processing attempts

The backend should:
- retry safely where appropriate
- log failures
- avoid duplicate anchoring
- return consistent status to THR/frontend

## TxID Mapping Back to THR

After a successful blockchain submission, the backend should map:
- transaction hash
- block number
- anchor ID
- confirmation status

back to the relevant THR record or business record.

This is important for:
- audit
- traceability
- verification
- reconciliation

## Event-Driven Post-Commit Model

The agreed system model is **event-driven post-commit**.

This means:
1. THR completes and commits its official business transaction first
2. the backend/notarization service receives the event
3. the blockchain stores the proof after THR commit

This ensures:
- THR remains the official legal record
- blockchain acts as proof, not primary authority

In plain language:

**THR records the event first, blockchain notarizes it second.**

## Identity, Access, and Governance

### Entra ID
Used for:
- administrative access
- application/service-level access control
- internal operator access
- role-based access to application components

### Besu Node Keys and Permissioning
Used for:
- validator identity
- node membership
- permissioned network participation
- consensus participation control

### Governance
Governance is broader than authentication.

Governance may include:
- authentication
- authorization
- validator membership rules
- node permissioning
- contract deployment/change control
- operational policies
- audit and compliance controls

So:
- **authentication is part of governance**
- **governance is not only authentication**

## Network Security Model

The solution is expected to run inside a private Azure environment.

Security assumptions:
- private VNet / subnet structure
- internal-only exposure
- no public blockchain endpoints
- NSGs and/or firewall controls
- private communication between services
- sovereign infrastructure under THR control

## Azure Deployment Model

### Frontend and Backend
The frontend and backend are separate services and can be packaged as separate Docker containers.

Possible deployment options:
- Azure Container Apps
- Azure Kubernetes Service (AKS)
- Azure App Service for containers

### Besu Network
Besu validator and RPC nodes can be hosted on:
- Azure VMs
- AKS
- containerized private infrastructure

### Smart Contract
The smart contract is deployed on the Besu permissioned network.

## Azure Services We Actually Need

Because the application logic is already being built in Node.js, we do **not** need Azure Logic Apps as the core orchestration mechanism.

The backend itself acts as the integration/notarization service.

### Recommended Azure services

#### Required / strongly recommended
- **Azure Container Registry (ACR)**  
  Store frontend/backend images

- **Azure compute platform**  
  Such as Container Apps, AKS, or App Service for containers

- **Virtual Network / subnets / NSGs**  
  Private network isolation

- **Azure Key Vault**  
  Store secrets, certificates, and sensitive configuration

- **Managed Identity**  
  Secure access from services to Azure resources without hardcoded secrets

- **Azure Monitor / Log Analytics**  
  Logs, telemetry, alerts, and operational observability

#### Optional
- **Azure Service Bus**  
  Useful if event-driven queue-based decoupling is needed

- **Azure API Management**  
  Useful for internal API gateway and governance

### Not required for the core flow
- Azure Logic Apps
- Azure Functions

unless specifically introduced for some operational reason later

## Why the Backend Is the Integration Layer

From a developer perspective, the backend/notarization service is where the real integration logic happens.

It is responsible for:
- input validation
- canonicalization
- hashing
- idempotency
- transaction submission
- receipt handling
- retry/error management
- TxID mapping

So if someone uses academic terms like:
- orchestration layer
- integration layer
- notarization layer
- middleware

you can generally interpret that as:

**our backend service**

## Microservice Interpretation

This project can be understood in microservice terms as follows:

- **Frontend service**
- **Backend / Notarization service**
- **Besu blockchain infrastructure**
- **Smart contract service layer on chain**

The frontend and backend are separate containers or services.  
The blockchain is a separate private platform dependency.

## Suggested Repository Structure

```text
project-root/
├── frontend/
├── backend/
├── smart-contract/
├── docs/
└── README.md
```

Possible contents:

```text
frontend/
  React or other Node.js frontend app

backend/
  Node.js REST API
  hashing
  canonicalization
  idempotency
  blockchain submission

smart-contract/
  Solidity contracts
  deployment scripts
  hardhat config

docs/
  architecture diagrams
  sequence diagrams
  deployment notes
```

## Development Stack

Suggested stack:

- Node.js
- Express.js
- React or similar frontend framework
- ethers.js
- Solidity
- Hardhat
- Hyperledger Besu
- Docker
- Azure

## Current Implementation Direction

The implementation direction agreed so far is:

- build frontend and backend in Node.js
- expose backend as REST API
- use backend as custom notarization/integration service
- connect backend to Besu using JSON-RPC
- deploy smart contract on Besu
- deploy frontend/backend as separate Dockerized services on Azure
- run Besu in a private Azure environment
- use private networking and internal-only exposure
- keep THR as system of record
- store only proofs on chain

## Key Developer Translation of Academic Terms

| Academic wording | Developer interpretation |
|---|---|
| Integrity layer | blockchain proof layer |
| Orchestration / integration layer | backend/notarization service |
| System of record | THR database/application |
| Sovereign infrastructure | private Azure deployment under THR control |
| Governance | access control + permissioning + operational control |
| Notarization | hash + submit tx + immutable proof |
| Post-commit event model | THR saves first, blockchain proof second |

## Final Summary

This project is a **Node.js-based, Azure-hosted, microservice-style permissioned blockchain solution** where:

- users interact with the frontend
- frontend talks to backend through REST APIs
- backend acts as the custom integration/notarization service
- backend communicates with Hyperledger Besu using JSON-RPC
- smart contracts are deployed on Besu
- THR remains the legal source of truth
- the blockchain provides immutable proof, timestamping, and auditability

