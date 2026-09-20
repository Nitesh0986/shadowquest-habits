import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import { getPlayer, updatePlayer, deletePlayer, getWeek } from "../controllers/playerController.js";

const router = Router();
router.use(protect);

router.get("/", getPlayer);
router.patch("/", updatePlayer);
router.delete("/", deletePlayer);
router.get("/week", getWeek);

export default router;
