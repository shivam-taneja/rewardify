import mongoose, { Schema, Document } from "mongoose";

export interface IChannel extends Document {
  channelId: string;
  owner: string;
  createdAt: Date;
}

const ChannelSchema = new Schema<IChannel>({
  channelId: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Channel = mongoose.model<IChannel>("Channel", ChannelSchema);
