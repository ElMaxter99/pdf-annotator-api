import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.post("/sessions", controller.createSession);
router.post("/refresh", controller.refreshToken);
router.delete("/sessions/current", auth, controller.logout);

export default router;
