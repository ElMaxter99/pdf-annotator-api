import { db } from "../db/memory.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt.js";

const PROJECT_KEY = "pdf-annotator";
const ACCESS_TOKEN_TTL = 900; // 15 minutes in seconds

const buildWorkspacePayload = (userId) => {
  return db.workspaces
    .filter((workspace) => workspace.members.some((member) => member.userId === userId))
    .map((workspace) => {
      const membership = workspace.members.find((member) => member.userId === userId);
      return {
        id: workspace.id,
        name: workspace.name,
        role: membership.role,
        updatedAt: workspace.updatedAt,
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

  const user = db.users.find((item) => item.email === email);

  if (!user || user.password !== password) {
    const err = new Error("Correo o contraseña incorrectos");
    err.status = 401;
    err.code = "invalid_credentials";
    throw err;
  }

  const workspaces = buildWorkspacePayload(user.id);
  const roles = buildRolesMap(workspaces);
  const defaultWorkspaceId = user.defaultWorkspaceId || workspaces[0]?.id || null;

  const accessToken = signAccessToken({
    sub: user.id,
    roles,
    defaultWorkspaceId,
  });

  const refreshToken = signRefreshToken({ sub: user.id });
  db.refreshTokens.set(refreshToken, { userId: user.id });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL,
    user: {
      id: user.id,
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

  const stored = db.refreshTokens.get(token);
  if (!stored) {
    const err = new Error("refreshToken inválido o expirado");
    err.status = 401;
    err.code = "invalid_refresh_token";
    throw err;
  }

  try {
    const payload = verifyToken(token);
    const userId = payload.sub;
    const user = db.users.find((item) => item.id === userId);

    if (!user) {
      db.refreshTokens.delete(token);
      const err = new Error("Usuario no encontrado");
      err.status = 401;
      err.code = "invalid_refresh_token";
      throw err;
    }

    const workspaces = buildWorkspacePayload(userId);
    const roles = buildRolesMap(workspaces);
    const defaultWorkspaceId = user.defaultWorkspaceId || workspaces[0]?.id || null;

    db.refreshTokens.delete(token);

    const accessToken = signAccessToken({ sub: userId, roles, defaultWorkspaceId });
    const newRefreshToken = signRefreshToken({ sub: userId });
    db.refreshTokens.set(newRefreshToken, { userId });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
    };
  } catch (error) {
    db.refreshTokens.delete(token);
    const err = new Error("refreshToken inválido o expirado");
    err.status = 401;
    err.code = "invalid_refresh_token";
    throw err;
  }
};

export const logout = async (user) => {
  if (!user) return;
  for (const [token, payload] of db.refreshTokens.entries()) {
    if (payload.userId === user.id) {
      db.refreshTokens.delete(token);
    }
  }
};
