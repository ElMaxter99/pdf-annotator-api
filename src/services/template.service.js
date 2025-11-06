import { Workspace } from "../db/models/workspace.model.js";
import { Template } from "../db/models/template.model.js";
import { TemplateVersion } from "../db/models/templateVersion.model.js";
import { versionConflict, parseIfMatchVersion } from "../utils/versioning.js";

const toIsoString = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(value).toISOString();
};

const findWorkspaceMembership = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId).lean().exec();
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

const formatTemplate = (template) => ({
  id: template._id ?? template.id,
  workspaceId: template.workspaceId,
  name: template.name,
  version: template.version,
  guidesEnabled: Boolean(template.guidesEnabled),
  guideSettings: {
    showGrid: Boolean(template.guideSettings?.showGrid),
    snapToGrid: Boolean(template.guideSettings?.snapToGrid),
    gridSize: Number.isFinite(template.guideSettings?.gridSize)
      ? template.guideSettings.gridSize
      : 12,
  },
  pages: Array.isArray(template.pages) ? template.pages : [],
  createdAt: toIsoString(template.createdAt),
  updatedAt: toIsoString(template.updatedAt),
});

export const list = async (workspaceId, userId) => {
  await findWorkspaceMembership(workspaceId, userId);
  const templates = await Template.find({ workspaceId }).lean().exec();
  return templates.map(formatTemplate);
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
  await findWorkspaceMembership(workspaceId, userId);

  if (!body?.name || typeof body.version !== "number") {
    const err = new Error("Nombre y versión son obligatorios");
    err.status = 400;
    err.code = "invalid_template";
    throw err;
  }

  const current = await Template.findOne({ _id: templateId, workspaceId }).lean().exec();

  const expectedVersion = parseIfMatchVersion(ifMatch);
  if (expectedVersion === null) {
    const err = new Error("Cabecera If-Match requerida con formato W/\"<n>\"");
    err.status = 428;
    err.code = "missing_if_match";
    throw err;
  }

  if (!current) {
    if (expectedVersion !== 0 || body.version !== 0) {
      throw versionConflict(0);
    }

    const templateDoc = await Template.create({
      _id: templateId,
      workspaceId,
      version: 1,
      ...normalizeTemplatePayload(body),
    });

    return { template: formatTemplate(templateDoc.toObject()), created: true };
  }

  if (current.version !== expectedVersion || body.version !== current.version) {
    throw versionConflict(current.version);
  }

  const updated = await Template.findOneAndUpdate(
    { _id: templateId, workspaceId },
    {
      ...normalizeTemplatePayload(body),
      version: current.version + 1,
    },
    { new: true, lean: true }
  ).exec();

  return { template: formatTemplate(updated), created: false };
};

export const remove = async ({ workspaceId, templateId, userId }) => {
  await findWorkspaceMembership(workspaceId, userId);
  const existing = await Template.findOne({ _id: templateId, workspaceId }).lean().exec();
  if (!existing) {
    const err = new Error("Plantilla no encontrada");
    err.status = 404;
    err.code = "template_not_found";
    throw err;
  }
  await Template.deleteOne({ _id: templateId, workspaceId }).exec();
};

export const createVersion = async ({ workspaceId, templateId, userId, body }) => {
  await findWorkspaceMembership(workspaceId, userId);
  const template = await Template.findOne({ _id: templateId, workspaceId }).lean().exec();

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

  const historyEntries = await TemplateVersion.find({ templateId }).lean().exec();
  const nextVersion =
    Math.max(template.version, body.sourceVersion, ...historyEntries.map((item) => item.version), 0) + 1;

  const versionDoc = await TemplateVersion.create({
    _id: `${templateId}:v${nextVersion}`,
    templateId,
    version: nextVersion,
    label: body.label,
    sourceVersion: body.sourceVersion,
  });

  return {
    id: versionDoc.id,
    templateId: versionDoc.templateId,
    version: versionDoc.version,
    label: versionDoc.label,
    createdAt: toIsoString(versionDoc.createdAt),
  };
};
