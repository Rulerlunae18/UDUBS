// backend/src/routes/real-users.js
const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

const { authRequired, adminOnly } = require('../middleware/auth');

// ============================================================
// 🔐 Только админ может видеть realUsers
// ============================================================
router.get('/', authRequired, adminOnly, async (req, res) => {
  try {
    const users = await prisma.realUser.findMany({
      select: {
        id: true,
        username: true,
        password: true,   // 🔥 UUID — оставляем
        email: true,      // 🔥 почта — оставляем
        role: true,
        is_online: true,
        last_seen: true,
        createdAt: true,
        userId: true,     // связь с User
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(users);
  } catch (err) {
    console.error('❌ Failed to load real users:', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
