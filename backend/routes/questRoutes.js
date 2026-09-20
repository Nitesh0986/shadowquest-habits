import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import validateObjectId from "../middleware/validateObjectId.js";
import { listQuests, createQuest, updateQuest, deleteQuest, completeQuest } from "../controllers/questController.js";

const router = Router();
router.use(protect);

router.get("/", listQuests);
router.post("/", createQuest);
router.patch("/:id", validateObjectId(), updateQuest);
router.delete("/:id", validateObjectId(), deleteQuest);
router.post("/:id/complete", validateObjectId(), completeQuest);

export default router;
