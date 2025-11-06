import { Router } from "express";
import authRoutes from "./auth.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import templateRoutes from "./template.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/template", templateRoutes);

export default router;
