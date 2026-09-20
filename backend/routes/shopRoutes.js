import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import { getShop, buyFrame, equipFrame } from "../controllers/shopController.js";

const router = Router();
router.use(protect);

router.get("/", getShop);
router.post("/:frameId/buy", buyFrame);
router.post("/:frameId/equip", equipFrame);

export default router;
