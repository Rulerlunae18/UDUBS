// backend/src/routes/realusers-self.js
const express = require('express');
const router = express.Router();

const { authRequired } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const { upload, uploadToSupabase } = require('../services/storage');

/* ============================================================
   GET /api/realusers-self/me
   Возвращает профиль текущего RealUser
   ============================================================ */
router.get('/me', authRequired, async (req, res) => {
  try {
    const u = req.user;

    let real;

    if (u.type === "real") {
      // 🎮 RenPy player
      real = await prisma.realUser.findUnique({
        where: { id: u.realUserId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatarUrl: true,
          is_online: true,
          last_seen: true,
          createdAt: true,
          password: true,
        },
      });
    } else {
      // 👤 System user (admin / staff)
      real = await prisma.realUser.findFirst({
        where: { userId: u.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatarUrl: true,
          is_online: true,
          last_seen: true,
          createdAt: true,
          password: true,
        },
      });
    }

    if (!real) {
      return res.status(404).json({ error: "RealUser not found" });
    }

    return res.json(real);

  } catch (err) {
    console.error("❌ GET /realusers-self/me error:", err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

/* ============================================================
   PUT /api/realusers-self/me/avatar
   Загрузка аватарки в Supabase
   ============================================================ */
router.put('/me/avatar', authRequired, upload.single('avatar'), async (req, res) => {
  try {
    const u = req.user;

    let real;

    if (u.type === "real") {
      real = await prisma.realUser.findUnique({
        where: { id: u.realUserId },
      });
    } else {
      real = await prisma.realUser.findFirst({
        where: { userId: u.id },
      });
    }

    if (!real) return res.status(404).json({ error: "RealUser not found" });
    if (!req.file) return res.status(400).json({ error: "avatar file required" });

    // === Загружаем файл в Supabase ===
    const avatarUrl = await uploadToSupabase(
      req.file.path,
      req.file.filename,
      req.file.mimetype
    );

    if (!avatarUrl) {
      return res.status(500).json({ error: "Supabase upload failed" });
    }

    // === Обновляем профиль ===
    const updated = await prisma.realUser.update({
      where: { id: real.id },
      data: { avatarUrl },
    });

    return res.json({
      ok: true,
      avatarUrl: updated.avatarUrl,
    });

  } catch (err) {
    console.error("❌ Avatar update error:", err);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
});

module.exports = router;
