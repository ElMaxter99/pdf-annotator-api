import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";

const router = Router();

router.post("/sessions", controller.createSession);
router.post("/refresh", controller.refreshToken);
router.delete("/sessions/current", controller.logout);

export default router;
