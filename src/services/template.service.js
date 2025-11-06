import { db } from "../db/memory.js";
import { versionConflict, parseIfMatchVersion } from "../utils/versioning.js";

const now = () => new Date().toISOString();

const findWorkspaceMembership = (workspaceId, userId) => {
  const workspace = db.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) {
    const err = new Error("Workspace no encontrado");
    err.status = 404;
    err.code = "workspace_not_found";
    throw err;
  }

  const membership = workspace.members.find((member) => member.userId === userId);
  if (!membership) {
    const err = new Error("Acceso no autorizado al workspace");
    err.status = 403;
    err.code = "forbidden";
    throw err;
  }

  return { workspace, membership };
};

const findTemplateIndex = (workspaceId, templateId) =>
  db.templates.findIndex((item) => item.workspaceId === workspaceId && item.id === templateId);

export const list = async (workspaceId, userId) => {
  findWorkspaceMembership(workspaceId, userId);
  return db.templates.filter((template) => template.workspaceId === workspaceId);
};

const normalizeTemplatePayload = (payload) => ({
  name: payload.name,
  guidesEnabled: Boolean(payload.guidesEnabled),
  guideSettings: {
    showGrid: Boolean(payload.guideSettings?.showGrid),
    snapToGrid: Boolean(payload.guideSettings?.snapToGrid),
    gridSize: Number.isFinite(payload.guideSettings?.gridSize)
      ? payload.guideSettings.gridSize
      : 12,
  },
  pages: Array.isArray(payload.pages) ? payload.pages : [],
});

export const save = async ({
  workspaceId,
  templateId,
  userId,
  body,
  ifMatch,
}) => {
  findWorkspaceMembership(workspaceId, userId);

  if (!body?.name || typeof body.version !== "number") {
    const err = new Error("Nombre y versión son obligatorios");
    err.status = 400;
    err.code = "invalid_template";
    throw err;
  }

  const index = findTemplateIndex(workspaceId, templateId);
  const current = index !== -1 ? db.templates[index] : null;

  const expectedVersion = parseIfMatchVersion(ifMatch);
  if (expectedVersion === null) {
    const err = new Error("Cabecera If-Match requerida con formato W/\"<n>\"");
    err.status = 428;
    err.code = "missing_if_match";
    throw err;
  }

  if (index === -1) {
    if (expectedVersion !== 0 || body.version !== 0) {
      throw versionConflict(0);
    }

    const template = {
      id: templateId,
      workspaceId,
      version: 1,
      createdAt: now(),
      updatedAt: now(),
      ...normalizeTemplatePayload(body),
    };

    db.templates.push(template);
    return { template, created: true };
  }

  if (current.version !== expectedVersion || body.version !== current.version) {
    throw versionConflict(current.version);
  }

  const updated = {
    ...current,
    ...normalizeTemplatePayload(body),
    version: current.version + 1,
    updatedAt: now(),
  };

  db.templates[index] = updated;
  return { template: updated, created: false };
};

export const remove = async ({ workspaceId, templateId, userId }) => {
  findWorkspaceMembership(workspaceId, userId);
  const index = findTemplateIndex(workspaceId, templateId);
  if (index === -1) {
    const err = new Error("Plantilla no encontrada");
    err.status = 404;
    err.code = "template_not_found";
    throw err;
  }
  db.templates.splice(index, 1);
};

export const createVersion = async ({ workspaceId, templateId, userId, body }) => {
  findWorkspaceMembership(workspaceId, userId);
  const template = db.templates.find(
    (item) => item.workspaceId === workspaceId && item.id === templateId
  );

  if (!template) {
    const err = new Error("Plantilla no encontrada");
    err.status = 404;
    err.code = "template_not_found";
    throw err;
  }

  if (typeof body?.sourceVersion !== "number" || !body.label) {
    const err = new Error("sourceVersion y label son obligatorios");
    err.status = 400;
    err.code = "invalid_template_version";
    throw err;
  }

  const historyEntries = db.templateVersions.filter((item) => item.templateId === templateId);
  const nextVersion =
    Math.max(template.version, body.sourceVersion, ...historyEntries.map((item) => item.version), 0) + 1;

  const versionEntry = {
    id: `${templateId}:v${nextVersion}`,
    templateId,
    version: nextVersion,
    label: body.label,
    sourceVersion: body.sourceVersion,
    createdAt: now(),
  };

  db.templateVersions.push(versionEntry);

  return {
    id: versionEntry.id,
    templateId: versionEntry.templateId,
    version: versionEntry.version,
    label: versionEntry.label,
    createdAt: versionEntry.createdAt,
  };
};
