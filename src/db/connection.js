import mongoose from "mongoose";
import { config } from "../config/env.js";
import { seedDatabase } from "./seed.js";

mongoose.set("strictQuery", true);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let attempt = 0;
  let lastError;

  while (attempt <= MAX_RETRIES) {
    try {
      await mongoose.connect(config.mongoUri, {
        dbName: config.mongoDbName,
      });

      await seedDatabase();

      return mongoose.connection;
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (attempt > MAX_RETRIES) {
        console.error("Error connecting to MongoDB", error);
        throw error;
      }

      const delay = RETRY_DELAY_MS * attempt;
      console.warn(
        `MongoDB connection failed (attempt ${attempt} of ${MAX_RETRIES}). Retrying in ${delay}ms...`
      );
      await wait(delay);
    }
  }

  throw lastError;
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
