import mongoose from "mongoose";
import { ENV } from "../config/env.js";

export async function connectMongo() {
  if (!ENV.MONGO_URL) {
    console.warn("[MongoDB] MONGO_URL not set — audit logging disabled");
    return;
  }
  await mongoose.connect(ENV.MONGO_URL);
  console.log("[MongoDB] connected");
}

export async function disconnectMongo() {
  await mongoose.disconnect();
  console.log("[MongoDB] disconnected");
}
