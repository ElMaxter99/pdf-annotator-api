import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export const signAccessToken = ({ sub, roles, defaultWorkspaceId }) =>
  jwt.sign({ roles, defaultWorkspaceId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    subject: sub,
  });

export const signRefreshToken = ({ sub }) =>
  jwt.sign({}, config.jwtSecret, {
    expiresIn: config.refreshExpiresIn,
    subject: sub,
  });

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);
