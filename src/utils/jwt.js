import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const signToken = (payload, options = {}) =>
  jwt.sign(payload, config.jwt.privateKey, {
    algorithm: config.jwt.algorithm,
    ...options,
  });

export const signAccessToken = ({ sub, roles, defaultWorkspaceId }) =>
  signToken(
    { roles, defaultWorkspaceId },
    {
      expiresIn: config.jwt.expiresIn,
      subject: sub,
    }
  );

export const signRefreshToken = ({ sub }) =>
  signToken(
    {},
    {
      expiresIn: config.jwt.refreshExpiresIn,
      subject: sub,
    }
  );

export const verifyToken = (token) =>
  jwt.verify(token, config.jwt.publicKey, {
    algorithms: [config.jwt.algorithm],
  });
