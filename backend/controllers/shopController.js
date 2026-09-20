import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { canAfford } from "../game-engine/economy.js";
import { FRAMES, getFrame } from "../data/frames.js";
import { badgeDTO, frameDTO } from "../utils/serialize.js";
import { buildPlayer, grantBadges, logActivities, updateUser } from "../services/playerService.js";

// GET /api/shop
export const getShop = asyncHandler(async (req, res) => {
  const user = req.user;
  res.json({
    gold: user.gold,
    equippedFrame: user.equippedFrame ?? null,
    items: FRAMES.map((f) => frameDTO(f, user)),
  });
});

// POST /api/shop/:frameId/buy   (a bought frame is worn straight away)
export const buyFrame = asyncHandler(async (req, res) => {
  const frame = getFrame(req.params.frameId);
  if (!frame) throw new AppError(404, "That frame doesn't exist.", "NOT_FOUND");

  const now = new Date();
  const { user, result } = await updateUser(req.user._id, (u) => {
    if (u.ownedFrames.includes(frame.id)) {
      throw new AppError(409, "You already own this frame.", "ALREADY_OWNED");
    }
    if (!canAfford(u.gold, frame.price)) {
      const needed = frame.price - u.gold;
      throw new AppError(400, `Not enough gold. You need ${needed}g more.`, "INSUFFICIENT_GOLD", { needed });
    }
    u.gold -= frame.price;
    u.ownedFrames.push(frame.id);
    u.equippedFrame = frame.id;
    return { newBadges: grantBadges(u, now) };
  });

  const entries = [{ type: "purchase", title: `Purchased the "${frame.name}" frame`, reward: `-${frame.price}g` }];
  result.newBadges.forEach((b) => entries.push({ type: "badge", title: `Earned the "${b.name}" badge` }));
  await logActivities(user._id, user.timezone, entries, now);

  res.json({
    player: await buildPlayer(user, now),
    item: frameDTO(frame, user),
    newBadges: result.newBadges.map((b) => badgeDTO(b, now)),
  });
});

// POST /api/shop/:frameId/equip   (equipping the frame you're already wearing takes it off)
export const equipFrame = asyncHandler(async (req, res) => {
  const frame = getFrame(req.params.frameId);
  if (!frame) throw new AppError(404, "That frame doesn't exist.", "NOT_FOUND");

  const { user } = await updateUser(req.user._id, (u) => {
    if (!u.ownedFrames.includes(frame.id)) {
      throw new AppError(403, "You don't own this frame yet.", "NOT_OWNED");
    }
    u.equippedFrame = u.equippedFrame === frame.id ? null : frame.id;
  });

  res.json({ equippedFrame: user.equippedFrame ?? null, player: await buildPlayer(user) });
});
