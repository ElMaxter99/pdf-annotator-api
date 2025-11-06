import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import * as controller from "../controllers/template.controller.js";

const router = Router({ mergeParams: true });

router.get("/", auth, controller.list);
router.put("/:templateId", auth, controller.save);
router.delete("/:templateId", auth, controller.remove);
router.post("/:templateId/versions", auth, controller.createVersion);

export default router;
