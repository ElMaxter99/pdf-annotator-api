import { v4 as uuid } from "uuid";

const now = () => new Date().toISOString();

export const db = {
  users: [
    {
      id: "usr_123",
      email: "editor@acme.com",
      password: "StrongPassw0rd!",
      name: "Ana Campos",
      avatarUrl: "https://cdn.example.com/avatars/usr_123.png",
      defaultWorkspaceId: "wrk_001",
    },
  ],
  workspaces: [
    {
      id: "wrk_001",
      name: "Demo",
      slug: "demo",
      members: [
        {
          id: uuid(),
          userId: "usr_123",
          role: "owner",
        },
      ],
      updatedAt: now(),
      createdAt: now(),
    },
    {
      id: "wrk_002",
      name: "Marketing",
      slug: "marketing",
      members: [
        {
          id: uuid(),
          userId: "usr_123",
          role: "viewer",
        },
      ],
      updatedAt: now(),
      createdAt: now(),
    },
  ],
  templates: [
    {
      id: "tpl_001",
      name: "Facturas",
      version: 3,
      workspaceId: "wrk_001",
      createdAt: "2024-11-30T08:00:00Z",
      updatedAt: "2025-01-09T17:41:00Z",
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
    },
  ],
  templateVersions: [],
  refreshTokens: new Map(),
};
