import cors from 'cors';
import dotenv from 'dotenv';
import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes, verifyMessage, Wallet } from "ethers";
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

const app = express();
const port = process.env.PORT || 3003;

// Load environment variables from .env file
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

import RewardifyABI from './Rewardify.json';

const provider = new JsonRpcProvider(process.env.RPC_URL);
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
const contractAddress = process.env.CONTRACT_ADDRESS!;
const contract = new Contract(contractAddress, RewardifyABI.abi, wallet);

// In-memory mapping for demo (replace with DB in prod)
const channelMap: Record<string, string> = {}; // { channelId: walletAddress }

/**
 * @route GET /is-registered/:channelId
 * @desc Check if channelId is in local DB (channelMap)
 * @returns { exists: boolean }
 */
app.get("/is-registered/:channelId", async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    const exists = !!channelMap[channelId];

    res.json({ exists });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to check registration" });
  }
});

/**
 * @route POST /register
 * @desc Register a creator (verify channel off-chain, then store & create pool)
 * @body { channelId: string, owner: string }
 */
app.post("/register", async (req: Request, res: Response) => {
  try {
    const { channelId, owner, signature, message } = req.body;
    if (!channelId || !owner || !signature || !message) {
      return res.status(400).json({ error: "channelId, owner, signature, and message are required" });
    }

    let recovered;
    try {
      recovered = verifyMessage(message, signature);
    } catch {
      return res.status(400).json({ error: "Invalid signature format" });
    }

    if (recovered.toLowerCase() !== owner.toLowerCase()) {
      return res.status(401).json({ error: "Signature does not match owner" });
    }

    const channelHash = keccak256(toUtf8Bytes(channelId));
    // Save mapping off-chain
    channelMap[channelId] = owner;

    // Create pool on-chain
    const tx = await contract.createPool(channelHash, owner);
    await tx.wait();

    res.json({
      success: true,
      message: "Channel registered and pool created",
      txHash: tx.hash,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to register" });
  }
});

/**
 * @route POST /tip
 * @desc Send tip to a channel's pool
 * @body { channelId: string, amount: string (in wei), tipperAddress: string, signature: string, message: string }
 */
app.post("/tip", async (req: Request, res: Response) => {
  try {
    const { channelId, amount, tipperAddress, signature, message } = req.body;

    if (!channelId || !amount || !tipperAddress || !signature || !message) {
      return res.status(400).json({ error: "channelId, amount, tipperAddress, signature, and message are required" });
    }

    // Verify signature
    let recovered;
    try {
      recovered = verifyMessage(message, signature);
    } catch {
      return res.status(400).json({ error: "Invalid signature format" });
    }

    if (recovered.toLowerCase() !== tipperAddress.toLowerCase()) {
      return res.status(401).json({ error: "Signature does not match tipper address" });
    }

    // Check if channel exists
    if (!channelMap[channelId]) {
      return res.status(404).json({ error: "Channel not registered" });
    }

    const channelHash = keccak256(toUtf8Bytes(channelId));

    // Call tip function on contract (backend sends the transaction with amount)
    const tx = await contract.tip(channelHash, { value: amount });
    await tx.wait();

    res.json({
      success: true,
      message: "Tip sent successfully",
      txHash: tx.hash,
      amount: amount
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to send tip" });
  }
});

/**
 * @route POST /withdraw
 * @desc Withdraw pool and distribute (creator, platform, top viewer)
 * @body { 
 *   channelId: string, 
 *   recipients: string[] (array of addresses: [creator, platform, topViewer]),
 *   amounts: string[] (array of amounts in wei corresponding to recipients)
 * }
 */
app.post("/withdraw", async (req: Request, res: Response) => {
  try {
    const { channelId, recipients, amounts, signature, message } = req.body;

    if (!channelId || !recipients || !amounts || !signature || !message) {
      return res.status(400).json({ error: "channelId, recipients, amounts, signature, and message are required" });
    }

    if (recipients.length !== amounts.length) {
      return res.status(400).json({ error: "recipients and amounts length mismatch" });
    }

    // Check if channel exists
    const creatorAddress = channelMap[channelId];
    if (!creatorAddress) {
      return res.status(404).json({ error: "Channel not registered" });
    }

    // Verify signature (creator must sign)
    let recovered;
    try {
      recovered = verifyMessage(message, signature);
    } catch {
      return res.status(400).json({ error: "Invalid signature format" });
    }

    if (recovered.toLowerCase() !== creatorAddress.toLowerCase()) {
      return res.status(401).json({ error: "Only channel owner can withdraw" });
    }

    const channelHash = keccak256(toUtf8Bytes(channelId));

    // Call withdraw on contract
    const tx = await contract.withdraw(channelHash, recipients, amounts);
    await tx.wait();

    res.json({
      success: true,
      message: "Withdrawal successful",
      txHash: tx.hash,
      recipients,
      amounts
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to withdraw" });
  }
});

/**
 * @route GET /pool-balance/:channelId
 * @desc Get current pool balance for a channel
 * @returns { balance: string (in wei), balanceEth: string }
 */
app.get("/pool-balance/:channelId", async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    if (!channelMap[channelId]) {
      return res.status(404).json({ error: "Channel not registered" });
    }

    const channelHash = keccak256(toUtf8Bytes(channelId));
    const balance = await contract.getPoolBalance(channelHash);

    res.json({
      channelId,
      balance: balance.toString(),
      balanceEth: (Number(balance) / 1e18).toFixed(6)
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to get balance" });
  }
});

/**
 * @route GET /channel-owner/:channelId
 * @desc Get owner wallet address for a channel
 * @returns { owner: string }
 */
app.get("/channel-owner/:channelId", async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    const channelHash = keccak256(toUtf8Bytes(channelId));
    const owner = await contract.getOwner(channelHash);

    res.json({
      channelId,
      owner
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to get owner" });
  }
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'fail', db: 'not_connected' });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error: ', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Make sure to close Prisma on process exit for clean shutdown
process.on('SIGINT', async () => {
  process.exit();
});
process.on('SIGTERM', async () => {
  process.exit();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});