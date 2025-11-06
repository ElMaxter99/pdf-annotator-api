import { v4 as uuid } from "uuid";
import { Workspace } from "../db/models/workspace.model.js";
import { User } from "../db/models/user.model.js";

const toIsoString = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(value).toISOString();
};

const findWorkspace = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId).exec();
  if (!workspace) {
    const err = new Error("Workspace no encontrado");
    err.status = 404;
    err.code = "workspace_not_found";
    throw err;
  }
  return workspace;
};

const ensureOwner = (workspace, userId) => {
  const members = workspace.members ?? [];
  const membership = members.find((member) => member.userId === userId);
  if (!membership || membership.role !== "owner") {
    const err = new Error("Permisos insuficientes");
    err.status = 403;
    err.code = "forbidden";
    throw err;
  }
};

const userHasOwnerRole = async (userId) => {
  const existing = await Workspace.exists({
    members: { $elemMatch: { userId, role: "owner" } },
  });
  return Boolean(existing);
};

export const list = async (userId) => {
  const workspaces = await Workspace.find({ "members.userId": userId }).lean().exec();

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

export const create = async (userId, { name, slug }) => {
  if (!name || !slug) {
    const err = new Error("Nombre y slug son obligatorios");
    err.status = 400;
    err.code = "invalid_workspace";
    throw err;
  }

  if (!(await userHasOwnerRole(userId))) {
    const err = new Error("Solo los propietarios pueden crear workspaces");
    err.status = 403;
    err.code = "forbidden";
    throw err;
  }

  const exists = await Workspace.exists({ slug });
  if (exists) {
    const err = new Error("Slug ya en uso");
    err.status = 409;
    err.code = "workspace_conflict";
    throw err;
  }

  const workspace = await Workspace.create({
    _id: `wrk_${uuid().slice(0, 8)}`,
    name,
    slug,
    members: [
      {
        id: uuid(),
        userId,
        role: "owner",
      },
    ],
  });

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

  const workspace = await findWorkspace(workspaceId);
  ensureOwner(workspace, userId);

  let memberUser = await User.findOne({ email }).exec();
  if (!memberUser) {
    memberUser = await User.create({
      _id: `usr_${uuid().slice(0, 8)}`,
      email,
      password: null,
      name: email.split("@")[0],
      avatarUrl: null,
      defaultWorkspaceId: workspace.id,
    });
  }

  const existingMembership = workspace.members.find((item) => item.userId === memberUser.id);
  if (existingMembership) {
    existingMembership.role = role;
  } else {
    workspace.members.push({ id: uuid(), userId: memberUser.id, role });
  }

  await workspace.save();

  return {
    id: memberUser.id,
    email: memberUser.email,
    role,
  };
};
