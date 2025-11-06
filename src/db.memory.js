export const db = {
  users: [
    {
      id: "usr_123",
      email: "editor@acme.com",
      password: "StrongPassw0rd!",
      name: "Ana aaa",
      avatarUrl: "",
    },
  ],

  workspaces: [
    { id: "wrk_001", name: "Demo", role: "owner", updatedAt: new Date().toISOString() }
  ],

  templates: [],
  refreshTokens: new Set()
};
