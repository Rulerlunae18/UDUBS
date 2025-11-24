// backend/src/controllers/realUsersController.js
const prisma = require("../utils/prisma");
const { publicUrl } = require("../services/storage");

/* ============================================================
   📌 Получить профиль текущего RealUser (по JWT)
   ============================================================ */
async function getOwnProfile(req, res) {
  try {
    if (!req.user || !req.user.realUserId) {
      return res.status(403).json({ error: "Only real users can access this" });
    }

    const realUserId = req.user.realUserId;

    const ru = await prisma.realUser.findUnique({
      where: { id: realUserId },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        avatarUrl: true,
        is_online: true,
        last_seen: true,
        createdAt: true
      }
    });

    if (!ru) return res.status(404).json({ error: "RealUser not found" });

    return res.json(ru);
  } catch (err) {
    console.error("getOwnProfile error:", err);
    return res.status(500).json({ error: "Failed to load real user profile" });
  }
}

/* ============================================================
   📌 Обновить только АВАТАР текущего RealUser (по JWT)
   ============================================================ */
async function updateOwnAvatar(req, res) {
  try {
    if (!req.user || !req.user.realUserId) {
      return res.status(403).json({ error: "Only real users can upload avatar" });
    }

    const realUserId = req.user.realUserId;

    if (!req.file) {
      return res.status(400).json({ error: "avatar file required" });
    }

    const avatarUrl = publicUrl(req.file.path);

    const updated = await prisma.realUser.update({
      where: { id: realUserId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true }
    });

    return res.json({ ok: true, avatarUrl: updated.avatarUrl });
  } catch (err) {
    console.error("updateOwnAvatar error:", err);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
}

module.exports = { getOwnProfile, updateOwnAvatar };
