// backend/src/routes/admin-players.js

const express = require("express");
const router = express.Router();
const prisma = require("../utils/prisma");

const { adminOnly } = require("../middleware/auth");

/* ============================================================
   🟥 ADMIN: Получить все игровые профили
   ============================================================ */
router.get("/profiles", adminOnly, async (req, res) => {
  try {
    const profiles = await prisma.gameProfile.findMany({
      include: { user: true },
      orderBy: { created_at: "desc" },
    });

    res.json({ ok: true, profiles });
  } catch (err) {
    console.error("❌ Error fetching profiles:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ============================================================
   🟥 ADMIN: Получить конкретный игровой профиль
   ============================================================ */
router.get("/profiles/:id", adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "Invalid id" });

    const profile = await prisma.gameProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) return res.status(404).json({ ok: false, error: "not found" });

    res.json({ ok: true, profile });
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ============================================================
   🟥 ADMIN: Активные игроки
   ============================================================ */
router.get("/players/active", adminOnly, async (req, res) => {
  try {
    const activePlayers = await prisma.realUser.findMany({
      where: { is_online: true },
      select: {
        id: true,
        username: true,
        last_seen: true,
        role: true,
      },
      orderBy: { last_seen: "desc" },
    });

    res.json({
      ok: true,
      count: activePlayers.length,
      players: activePlayers,
    });
  } catch (err) {
    console.error("❌ Failed to fetch active players:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

module.exports = router;
