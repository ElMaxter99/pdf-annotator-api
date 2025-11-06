import { db } from "../db/memory.js";
import { versionConflict } from "../utils/versioning.js";

export const list = (workspaceId) => {
  return db.templates.filter(t => t.workspaceId === workspaceId);
};

export const save = (workspaceId, templateId, data, expectedVersion) => {
  const existing = db.templates.find(t => t.id === templateId);

  if (existing && existing.version !== expectedVersion) {
    throw versionConflict(existing.version);
  }

  const newVersion = existing ? existing.version + 1 : 1;

  const template = {
    id: templateId,
    workspaceId,
    ...data,
    version: newVersion,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString()
  };

  if (!existing) db.templates.push(template);
  else Object.assign(existing, template);

  return template;
};

export const remove = (workspaceId, id) => {
  db.templates = db.templates.filter(t => !(t.workspaceId === workspaceId && t.id === id));
};

export const createVersion = (workspaceId, templateId, sourceVersion, label) => {
  const templ = db.templates.find(t => t.id === templateId);

  if (!templ) throw new Error("template_not_found");

  return {
    id: `${templateId}:v${sourceVersion + 1}`,
    templateId,
    version: sourceVersion + 1,
    label,
    createdAt: new Date().toISOString()
  };
};
