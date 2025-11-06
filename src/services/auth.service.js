import bcrypt from "bcryptjs";
import { config } from "../config/env.js";
import { User } from "../db/models/user.model.js";
import { Workspace } from "../db/models/workspace.model.js";
import { RefreshToken } from "../db/models/refreshToken.model.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt.js";

const PROJECT_KEY = "pdf-annotator";
const ACCESS_TOKEN_TTL = config.jwt.accessTokenTtlSeconds || 900; // seconds

const toIsoString = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(value).toISOString();
};

const buildWorkspacePayload = async (userId) => {
  const workspaces = await Workspace.find({
    "members.userId": userId,
  })
    .lean()
    .exec();

  return workspaces.map((workspace) => {
    const membership = workspace.members.find((member) => member.userId === userId);
    return {
      id: workspace._id,
      name: workspace.name,
      role: membership?.role ?? "viewer",
      updatedAt: toIsoString(workspace.updatedAt),
    };
  });
};

const buildRolesMap = (workspaces) => {
  return workspaces.reduce((acc, workspace) => {
    acc[workspace.id] = workspace.role;
    return acc;
  }, {});
};

export const login = async ({ email, password, projectKey }) => {
  if (!email || !password || !projectKey) {
    const err = new Error("Credenciales incompletas");
    err.status = 400;
    err.code = "invalid_credentials";
    throw err;
  }

  if (projectKey !== PROJECT_KEY) {
    const err = new Error("Project key inválido");
    err.status = 403;
    err.code = "invalid_project_key";
    throw err;
  }

  const user = await User.findOne({ email }).lean().exec();

  if (!user) {
    const err = new Error("Correo o contraseña incorrectos");
    err.status = 401;
    err.code = "invalid_credentials";
    throw err;
  }

  const hashedPassword = user.password ?? "";
  const passwordMatches = await bcrypt.compare(password, hashedPassword);

  if (!passwordMatches) {
    const err = new Error("Correo o contraseña incorrectos");
    err.status = 401;
    err.code = "invalid_credentials";
    throw err;
  }

  const workspaces = await buildWorkspacePayload(user._id);
  const roles = buildRolesMap(workspaces);
  const defaultWorkspaceId = user.defaultWorkspaceId || workspaces[0]?.id || null;

  const accessToken = signAccessToken({
    sub: user._id,
    roles,
    defaultWorkspaceId,
  });

  const refreshToken = signRefreshToken({ sub: user._id });
  await RefreshToken.create({ token: refreshToken, userId: user._id });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    workspaces,
    defaultWorkspaceId,
  };
};

export const refresh = async (token) => {
  if (!token) {
    const err = new Error("refreshToken requerido");
    err.status = 400;
    err.code = "invalid_refresh_token";
    throw err;
  }

  const stored = await RefreshToken.findOne({ token }).lean().exec();
  if (!stored) {
    const err = new Error("refreshToken inválido o expirado");
    err.status = 401;
    err.code = "invalid_refresh_token";
    throw err;
  }

  try {
    const payload = verifyToken(token);
    const userId = payload.sub;
    const user = await User.findById(userId).lean().exec();

    if (!user) {
      await RefreshToken.deleteOne({ token });
      const err = new Error("Usuario no encontrado");
      err.status = 401;
      err.code = "invalid_refresh_token";
      throw err;
    }

    const workspaces = await buildWorkspacePayload(userId);
    const roles = buildRolesMap(workspaces);
    const defaultWorkspaceId = user.defaultWorkspaceId || workspaces[0]?.id || null;

    await RefreshToken.deleteOne({ token });

    const accessToken = signAccessToken({ sub: userId, roles, defaultWorkspaceId });
    const newRefreshToken = signRefreshToken({ sub: userId });
    await RefreshToken.create({ token: newRefreshToken, userId });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
    };
  } catch (error) {
    await RefreshToken.deleteOne({ token });
    const err = new Error("refreshToken inválido o expirado");
    err.status = 401;
    err.code = "invalid_refresh_token";
    throw err;
  }
};

export const logout = async (user) => {
  if (!user) return;
  await RefreshToken.deleteMany({ userId: user.id });
};
