import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import { getBadges } from "../controllers/badgeController.js";

const router = Router();
router.use(protect);
router.get("/", getBadges);

export default router;
