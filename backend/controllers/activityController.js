import Activity from "../models/Activity.js";
import asyncHandler from "../utils/asyncHandler.js";
import { activityDTO } from "../utils/serialize.js";

// GET /api/activity?limit=6   newest first (default 10, max 50)
export const getActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const rows = await Activity.find({ userId: req.user._id }).sort({ createdAt: -1, _id: -1 }).limit(limit);
  const now = new Date();
  res.json({ activity: rows.map((a) => activityDTO(a, req.user.timezone, now)) });
});
