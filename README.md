# Cross-Chain DEX (BTC ↔ EVM Swap Engine)

A backend-focused **cross-chain swap execution engine** that enables **BTC ↔ EVM** asset swaps using **LiFi API**, **0x API**, and native **Bitcoin PSBT signing**.

This project demonstrates how modern cross-chain routing, fee abstraction, and execution can be orchestrated **without relying on a heavy frontend**, while still being fully compatible with wallets, signers, and APIs.

---

## Key Features

- 🔁 **Cross-chain swaps** between Bitcoin and EVM chains
- 🧠 **Smart routing via LiFi API** (best route selection)
- ⚡ **0x API integration** for EVM swap execution
- ₿ **Bitcoin PSBT signing & broadcasting** (no custodial services)
- 💸 **Fee-integrated transactions** (LiFi/0x + integrator fees)
- 🧩 Modular, production-style backend architecture

---

## High-Level Architecture

```
Client / Chat Interface
        │
        ▼
Swap Controller (API Layer)
        │
        ├── LiFi Route Discovery for tx including BTC 
        │       ├── Best path selection
        │       ├── Fee & slippage integration
        │
        ├── Execution Layer
        │       ├── EVM: 0x-compatible tx execution
        │       └── BTC: PSBT build → sign → broadcast
        │
        └── Status Tracking
```

---

## How the Swap Flow Works

### 1️⃣ Route Discovery (LiFi)
- The backend requests optimal routes using **LiFi API**
- Handles:
  - Chain selection (BTC ↔ EVM)
  - Token decimals
  - Fee + slippage constraints
- Returns either:
  - **EVM transactionRequest** (ready for ethers.js)
  - **BTC deposit + PSBT execution flow**

---

### 2️⃣ Execution Logic

#### 🔹 EVM Side (ETH / ERC20)
- Uses **0x-compatible transaction requests**
- Handles:
  - Token approvals (ERC20 allowance checks)
  - Fee-inclusive calldata execution
- Final transaction is sent using an EVM signer (ethers.js compatible)

#### 🔹 Bitcoin Side (BTC)
- Uses **bitcoinjs-lib + PSBT**
- Flow:
  1. Parse PSBT from route
  2. Inject ECC engine (`tiny-secp256k1`)
  3. Load private key from WIF
  4. Sign all inputs
  5. Validate signatures
  6. Finalize & extract raw transaction
  7. Broadcast via Blockstream API

---

### 3️⃣ Memo / Metadata Handling (BTC)
- Supports optional **OP_RETURN memo extraction**
- Useful for:
  - Route identification
  - Swap metadata
  - Debugging & analytics

---

## Tech Stack

### Backend
- **Node.js (ESM)**
- **Express.js**

### Blockchain / Web3
- **LiFi API** – cross-chain routing
- **0x API** – EVM swap execution
- **ethers.js** – EVM signing & transactions
- **bitcoinjs-lib** – BTC PSBT handling
- **ecpair + tiny-secp256k1** – BTC key & signature validation

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# LiFi
LIFI_API_KEY=your_lifi_api_key
LIFI_INTEGRATOR=your_app_name
LIFI_FEE=0.01
LIFI_SLIPPAGE=0.01
LIFI_API_BASE=https://li.quest/v1

# 0x
ZEROX_API_KEY=your_0x_api_key
ZEROX_BASE=https://api.0x.org
ZEROX_VERSION=v2
FEE_PERCENT=100
FEE_SIDE=buy

# Bitcoin
BTC_WIF=your_bitcoin_private_key_wif
BLOCKSTREAM_BASE_API=https://blockstream.info/api
BTC_CHAINID=20000000000001

# Ethereum
EVM_PK=your_ethereum_private_key
ETH_CHAINID=1

# Network
RPC_URL=https://your_evm_rpc

#Wallet info
PLATFORM_FEE_RECIPIENT=wallet_address_to_recieve_fee
```

⚠️ All environment variables are read as **strings**. Convert where necessary.

---

## Installation

```bash
git clone https://github.com/vishwas955/Cross-Chain-DEX.git
cd Cross-Chain-DEX
npm install
```

---

## Running the Project

```bash
npm run dev
```

Server will start and expose swap endpoints.

---

## Example Swap Execution (Conceptual)

```text
User: Swap 0.1 BTC to USDC

→ LiFi finds optimal BTC → USDT → USDC route
→ Backend prepares PSBT
→ BTC tx is signed & broadcast
→ EVM tx is generated and executed
→ Fees handled automatically
```

---

## Why This Project Matters

This project demonstrates:

- Real-world **cross-chain execution complexity**
- Handling **BTC & EVM in a single backend**
- Proper use of **routing SDKs vs execution APIs**
- Fee abstraction and transaction safety
- Production-style modular design

It goes beyond simple swap demos by focusing on **how swaps actually execute under the hood**.
---

## Author

Built by **Vishwas Rami**

Focused on protocol-level engineering, cross-chain systems, and backend Web3 architecture.

