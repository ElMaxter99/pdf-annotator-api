import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import * as controller from "../controllers/workspace.controller.js";
import templateRoutes from "./template.routes.js";

const router = Router();

router.get("/", auth, controller.list);
router.post("/", auth, controller.create);
router.post("/:workspaceId/members", auth, controller.inviteMember);
router.use("/:workspaceId/templates", templateRoutes);

export default router;
