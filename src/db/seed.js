import { v4 as uuid } from "uuid";
import { User } from "./models/user.model.js";
import { Workspace } from "./models/workspace.model.js";
import { Template } from "./models/template.model.js";
import { TemplateVersion } from "./models/templateVersion.model.js";

const now = () => new Date().toISOString();

const seedUsers = async () => {
  const existing = await User.exists({ _id: "usr_123" });
  if (existing) {
    return;
  }

  await User.create({
    _id: "usr_123",
    email: "editor@acme.com",
    password: "StrongPassw0rd!",
    name: "Ana Campos",
    avatarUrl: "https://cdn.example.com/avatars/usr_123.png",
    defaultWorkspaceId: "wrk_001",
  });
};

const seedWorkspaces = async () => {
  const existing = await Workspace.exists({ _id: "wrk_001" });
  if (existing) {
    return;
  }

  const membersBase = [{ id: uuid(), userId: "usr_123", role: "owner" }];

  await Workspace.create([
    {
      _id: "wrk_001",
      name: "Demo",
      slug: "demo",
      members: membersBase,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: "wrk_002",
      name: "Marketing",
      slug: "marketing",
      members: [{ id: uuid(), userId: "usr_123", role: "viewer" }],
      createdAt: now(),
      updatedAt: now(),
    },
  ]);
};

const seedTemplates = async () => {
  const existing = await Template.exists({ _id: "tpl_001" });
  if (existing) {
    return;
  }

  await Template.create({
    _id: "tpl_001",
    name: "Facturas",
    version: 3,
    workspaceId: "wrk_001",
    createdAt: new Date("2024-11-30T08:00:00Z"),
    updatedAt: new Date("2025-01-09T17:41:00Z"),
    guidesEnabled: true,
    guideSettings: {
      showGrid: true,
      snapToGrid: true,
      gridSize: 12,
    },
    pages: [
      {
        num: 1,
        fields: [
          {
            id: "fld_1",
            type: "text",
            x: 120,
            y: 250,
            width: 320,
            height: 48,
            rotation: 0,
            fontFamily: "Helvetica",
            fontSize: 14,
            opacity: 1,
            textAlign: "left",
            content: "Nombre del cliente",
            backgroundColor: "rgba(255,255,255,0)",
          },
        ],
      },
    ],
  });
};

export const seedDatabase = async () => {
  await seedUsers();
  await seedWorkspaces();
  await seedTemplates();
  await TemplateVersion.createCollection().catch(() => {});
};
