// backend/src/routes/auth.js

const express = require("express");
const router = express.Router();
const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { upload } = require("../services/storage");
const { authRequired } = require("../middleware/auth");

/* ===========================================================
   Генерация JWT
   =========================================================== */
function signToken(user, realUser = null) {
  return jwt.sign(
    {
      id: user.id,           // системный USER.id
      email: user.email,
      name: user.name,
      role: user.role,

      realUserId: realUser?.id || null, // id RealUser (если есть)
      realUsername: realUser?.username || null
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

/* ===========================================================
   Обновление online / last_seen
   =========================================================== */
async function touchRealUserByUserId(userId, online = true) {
  await prisma.realUser.updateMany({
    where: { userId },
    data: {
      is_online: online,
      last_seen: new Date(),
    },
  });
}

async function touchRealUserByRealId(realId, online = true) {
  await prisma.realUser.update({
    where: { id: realId },
    data: {
      is_online: online,
      last_seen: new Date(),
    },
  });
}

/* ===========================================================
   GET /auth/me
   =========================================================== */
router.get("/me", authRequired, async (req, res) => {
  try {
    // если это RealUser → обновляем его last_seen
    if (req.user.realUserId) {
      await touchRealUserByRealId(req.user.realUserId, true);
    }

    return res.json({
      ok: true,
      user: req.user,
    });
  } catch (err) {
    console.error("❌ /me error:", err);
    return res.status(500).json({ ok: false });
  }
});

/* ===========================================================
   POST /auth/login
   Авторизация И системных User, И RealUser
   =========================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    /* -------------------------------------------------------
       1) Попытка логина системного USER
       ------------------------------------------------------- */
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && await bcrypt.compare(password, user.password)) {
      const token = signToken(user, null);

      // realUser может не существовать
      await touchRealUserByUserId(user.id, true);

      console.log(`🟢 User login: ${user.email}`);

      return res.json({
        ok: true,
        role: "SYSTEM",
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token
      });
    }

    /* -------------------------------------------------------
       2) Попытка логина REALUSER
       ------------------------------------------------------- */
    const real = await prisma.realUser.findFirst({
      where: { email, password }
    });

    if (real) {
      const user2 = await prisma.user.findUnique({
        where: { id: real.userId }
      });

      const token = signToken(user2, real);

      await touchRealUserByRealId(real.id, true);

      console.log(`🎮 RealUser login: ${real.username}`);

      return res.json({
        ok: true,
        role: "REAL",
        user: {
          id: user2.id,
          email: real.email,
          name: real.username,
          role: real.role || "RESEARCHER",
          realUserId: real.id
        },
        token
      });
    }

    /* -------------------------------------------------------
       3) Неверные данные
       ------------------------------------------------------- */
    return res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: "login_failed" });
  }
});

/* ===========================================================
   POST /auth/logout
   =========================================================== */
router.post("/logout", authRequired, async (req, res) => {
  try {
    if (req.user.realUserId) {
      await touchRealUserByRealId(req.user.realUserId, false);
    }

    return res.json({
      ok: true,
      message: "Logged out — remove token on client."
    });
  } catch (err) {
    console.error("❌ Logout error:", err);
    return res.status(500).json({ ok: false });
  }
});

/* ===========================================================
   Фейковая регистрация
   =========================================================== */
router.post("/register", upload.single("file"), async (req, res) => {
  try {
    const { fakeRegister } = require("../controllers/authController");
    await fakeRegister(req, res);
  } catch (err) {
    console.error("❌ Fake register error:", err);
    return res.status(500).json({ error: "register_failed" });
  }
});

module.exports = router;
