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
import { Channel } from './models/Channels';
import mongoose from 'mongoose';

const provider = new JsonRpcProvider(process.env.RPC_URL);
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);
const contractAddress = process.env.CONTRACT_ADDRESS!;
const contract = new Contract(contractAddress, RewardifyABI.abi, wallet);


const mongoUri = process.env.MONGO_URI!;
if (!mongoUri) {
  throw new Error("Missing MONGO_URI in .env");
}

mongoose
  .connect(mongoUri, {
    dbName: "rewardify",
  })
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });



/**
 * @route GET /is-registered/:channelId
 * @desc Check if channelId exists in DB
 */
app.get("/is-registered/:channelId", async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findOne({ channelId });
    res.json({ exists: !!channel });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to check registration" });
  }
});

/**
 * @route POST /register
 * @desc Register a creator and create pool on-chain
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
      console.log("INvalid sig format")
      return res.status(400).json({ error: "Invalid signature format" });
    }

    if (recovered.toLowerCase() !== owner.toLowerCase()) {
      return res.status(401).json({ error: "Signature does not match owner" });
    }

    const existing = await Channel.findOne({ channelId });
    if (existing) {
      console.log("DUplicate")
      return res.status(400).json({ error: "Channel already registered" });
    }

    // Save mapping in MongoDB
    await Channel.create({ channelId, owner });

    // Create pool on-chain
    const channelHash = keccak256(toUtf8Bytes(channelId));
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
 * @desc Send tip to a channel’s pool
 */
app.post("/tip", async (req: Request, res: Response) => {
  try {
    const { channelId, amount, tipperAddress, signature, message } = req.body;
    if (!channelId || !amount || !tipperAddress || !signature || !message) {
      return res.status(400).json({ error: "channelId, amount, tipperAddress, signature, and message are required" });
    }

    let recovered;
    try {
      recovered = verifyMessage(message, signature);
    } catch {
      return res.status(400).json({ error: "Invalid signature format" });
    }

    if (recovered.toLowerCase() !== tipperAddress.toLowerCase()) {
      return res.status(401).json({ error: "Signature does not match tipper address" });
    }

    const channel = await Channel.findOne({ channelId });
    if (!channel) {
      return res.status(404).json({ error: "Channel not registered" });
    }

    const channelHash = keccak256(toUtf8Bytes(channelId));
    const tx = await contract.tip(channelHash, { value: amount });
    await tx.wait();

    res.json({
      success: true,
      message: "Tip sent successfully",
      txHash: tx.hash,
      amount
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to send tip" });
  }
});

/**
 * @route POST /withdraw
 * @desc Withdraw pool and distribute
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

    const channel = await Channel.findOne({ channelId });
    if (!channel) {
      return res.status(404).json({ error: "Channel not registered" });
    }

    let recovered;
    try {
      recovered = verifyMessage(message, signature);
    } catch {
      return res.status(400).json({ error: "Invalid signature format" });
    }

    if (recovered.toLowerCase() !== channel.owner.toLowerCase()) {
      return res.status(401).json({ error: "Only channel owner can withdraw" });
    }

    const channelHash = keccak256(toUtf8Bytes(channelId));
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
 */
app.get("/pool-balance/:channelId", async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findOne({ channelId });
    if (!channel) {
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
 */
app.get("/channel-owner/:channelId", async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const channelHash = keccak256(toUtf8Bytes(channelId));
    const owner = await contract.getOwner(channelHash);
    res.json({ channelId, owner });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to get owner" });
  }
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'not_connected';
    res.status(200).json({ status: 'ok', db: dbState });
  } catch {
    res.status(500).json({ status: 'fail', db: 'not_connected' });
  }
});

// 404 + error handlers
app.use((req: Request, res: Response) => res.status(404).json({ error: 'Not Found' }));
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error: ', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});