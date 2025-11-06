import dotenv from "dotenv";
dotenv.config();

const parseNumber = (value, fallback) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: parseNumber(process.env.PORT, 3000),
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpiresIn: "15m",
  refreshExpiresIn: "30d",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/pdf-annotator",
  mongoDbName: process.env.MONGO_DB_NAME || "pdf-annotator",
};
