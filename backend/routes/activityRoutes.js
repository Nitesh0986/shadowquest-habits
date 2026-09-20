import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import { getActivity } from "../controllers/activityController.js";

const router = Router();
router.use(protect);
router.get("/", getActivity);

export default router;
