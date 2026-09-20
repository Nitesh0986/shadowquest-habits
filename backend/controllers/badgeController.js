import asyncHandler from "../utils/asyncHandler.js";
import { evaluateBadges } from "../game-engine/badges.js";
import { badgeDTO } from "../utils/serialize.js";

// GET /api/badges   all 19, each with live progress and when it was unlocked
export const getBadges = asyncHandler(async (req, res) => {
  const user = req.user;
  const plain = user.toObject();
  const unlockedAt = new Map(user.unlockedBadges.map((b) => [b.badgeId, b.unlockedAt]));

  const badges = evaluateBadges(plain, plain.ownedFrames).map((b) => badgeDTO(b, unlockedAt.get(b.id) ?? null));
  res.json({ badges, earned: badges.filter((b) => b.unlocked).length, total: badges.length });
});
