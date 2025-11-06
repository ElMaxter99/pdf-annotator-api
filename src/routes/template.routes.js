import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import * as controller from "../controllers/template.controller.js";

const router = Router({ mergeParams: true });

router.get("/:workspaceId/templates", auth, controller.list);

router.put("/:workspaceId/templates/:templateId", auth, controller.save);

router.delete("/:workspaceId/templates/:templateId", auth, controller.remove);

router.post("/:workspaceId/templates/:templateId/versions", auth, controller.createVersion);

export default router;
