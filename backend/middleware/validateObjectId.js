import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

// Rejects /api/quests/not-an-id with a clean 400 instead of a database cast error.
export default function validateObjectId(param = "id") {
  return (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) {
      return next(new AppError(400, "That id isn't valid.", "INVALID_ID"));
    }
    next();
  };
}
