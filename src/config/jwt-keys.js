import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { generateKeyPairSync } from "node:crypto";

const PRIVATE_KEY_FILENAME = "jwtRS256.key";
const PUBLIC_KEY_FILENAME = "jwtRS256.key.pub";

const createKeyPair = () =>
  generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

const writeKeyFile = (filePath, content, mode) => {
  writeFileSync(filePath, content, { mode });
};

export const loadOrCreateJwtKeys = (directory) => {
  const resolvedDir = resolve(process.cwd(), directory || "keys");
  mkdirSync(resolvedDir, { recursive: true });

  const privateKeyPath = join(resolvedDir, PRIVATE_KEY_FILENAME);
  const publicKeyPath = join(resolvedDir, PUBLIC_KEY_FILENAME);

  const missingPrivate = !existsSync(privateKeyPath);
  const missingPublic = !existsSync(publicKeyPath);

  if (missingPrivate || missingPublic) {
    const { privateKey, publicKey } = createKeyPair();
    writeKeyFile(privateKeyPath, privateKey, 0o600);
    writeKeyFile(publicKeyPath, publicKey, 0o644);
  }

  const privateKey = readFileSync(privateKeyPath, "utf8");
  const publicKey = readFileSync(publicKeyPath, "utf8");

  return {
    directory: resolvedDir,
    privateKey,
    publicKey,
    privateKeyPath,
    publicKeyPath,
  };
};
