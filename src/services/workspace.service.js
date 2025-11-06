import { v4 as uuid } from "uuid";
import { db } from "../db/memory.js";

const now = () => new Date().toISOString();

const findWorkspace = (workspaceId) => {
  const workspace = db.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) {
    const err = new Error("Workspace no encontrado");
    err.status = 404;
    err.code = "workspace_not_found";
    throw err;
  }
  return workspace;
};

const ensureOwner = (workspace, userId) => {
  const membership = workspace.members.find((member) => member.userId === userId);
  if (!membership || membership.role !== "owner") {
    const err = new Error("Permisos insuficientes");
    err.status = 403;
    err.code = "forbidden";
    throw err;
  }
};

const userHasOwnerRole = (userId) => {
  return db.workspaces.some((workspace) => {
    const membership = workspace.members.find((member) => member.userId === userId);
    return membership && membership.role === "owner";
  });
};

export const list = async (userId) => {
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

export const create = async (userId, { name, slug }) => {
  if (!name || !slug) {
    const err = new Error("Nombre y slug son obligatorios");
    err.status = 400;
    err.code = "invalid_workspace";
    throw err;
  }

  if (!userHasOwnerRole(userId)) {
    const err = new Error("Solo los propietarios pueden crear workspaces");
    err.status = 403;
    err.code = "forbidden";
    throw err;
  }

  const exists = db.workspaces.some((workspace) => workspace.slug === slug);
  if (exists) {
    const err = new Error("Slug ya en uso");
    err.status = 409;
    err.code = "workspace_conflict";
    throw err;
  }

  const workspace = {
    id: `wrk_${uuid().slice(0, 8)}`,
    name,
    slug,
    members: [
      {
        id: uuid(),
        userId,
        role: "owner",
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  };

  db.workspaces.push(workspace);

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role: "owner",
  };
};

export const inviteMember = async (userId, workspaceId, { email, role }) => {
  if (!email || !role) {
    const err = new Error("Email y rol son obligatorios");
    err.status = 400;
    err.code = "invalid_member";
    throw err;
  }

  const allowedRoles = ["owner", "editor", "viewer"];
  if (!allowedRoles.includes(role)) {
    const err = new Error("Rol inválido");
    err.status = 400;
    err.code = "invalid_member";
    throw err;
  }

  const workspace = findWorkspace(workspaceId);
  ensureOwner(workspace, userId);

  let memberUser = db.users.find((item) => item.email === email);
  if (!memberUser) {
    memberUser = {
      id: `usr_${uuid().slice(0, 8)}`,
      email,
      password: null,
      name: email.split("@")[0],
      avatarUrl: null,
      defaultWorkspaceId: workspace.id,
    };
    db.users.push(memberUser);
  }

  const existingMembership = workspace.members.find((item) => item.userId === memberUser.id);
  if (existingMembership) {
    existingMembership.role = role;
  } else {
    workspace.members.push({ id: uuid(), userId: memberUser.id, role });
  }

  workspace.updatedAt = now();

  return {
    id: memberUser.id,
    email: memberUser.email,
    role,
  };
};
