import dotenv from "dotenv";
import { loadOrCreateJwtKeys } from "./jwt-keys.js";

dotenv.config();

const parseNumber = (value, fallback) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDurationToSeconds = (value, fallback) => {
  if (!value) return fallback;

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const match = /^([0-9]+)([smhd])$/.exec(value.trim());
  if (!match) return fallback;

  const amount = Number(match[1]);
  const unit = match[2];

  const unitMultipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return amount * (unitMultipliers[unit] ?? 1);
};

const jwtKeys = loadOrCreateJwtKeys(process.env.JWT_KEYS_DIR || "keys");
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
const refreshExpiresIn = process.env.REFRESH_EXPIRES_IN || "30d";

export const config = {
  port: parseNumber(process.env.PORT, 3000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/pdf-annotator",
  mongoDbName: process.env.MONGO_DB_NAME || "pdf-annotator",
  jwt: {
    algorithm: "RS256",
    expiresIn: jwtExpiresIn,
    refreshExpiresIn,
    accessTokenTtlSeconds: parseDurationToSeconds(jwtExpiresIn, 900),
    refreshTokenTtlSeconds: parseDurationToSeconds(refreshExpiresIn, 2592000),
    keysDir: jwtKeys.directory,
    privateKey: jwtKeys.privateKey,
    publicKey: jwtKeys.publicKey,
    privateKeyPath: jwtKeys.privateKeyPath,
    publicKeyPath: jwtKeys.publicKeyPath,
  },
};
