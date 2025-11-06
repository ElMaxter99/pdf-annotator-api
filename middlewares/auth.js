import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "missing_token" });

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
};
