// backend/src/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

/* ============================================================
   HELPER: создать JWT токен
   ============================================================ */
function signSystemUserToken(user) {
  return jwt.sign(
    {
      id: user.id,              // system user id
      realUserId: null,         // нет realUser
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

/* ============================================================
   ВСПОМОГАТЕЛЬНАЯ: создать FakeUser для системного USER
   ============================================================ */
async function ensureFakeUserForSystemUser(user) {
  const exists = await prisma.fakeUser.findUnique({
    where: { userId: user.id },
  });

  if (exists) return exists;

  return prisma.fakeUser.create({
    data: {
      codename: user.name || user.email.split("@")[0],
      rank: user.title || "Investigator",
      clearance: "Ω",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || null,
      userId: user.id,
    },
  });
}

/* ============================================================
   ВСПОМОГАТЕЛЬНАЯ: FakeUser слот для RealUser (RenPy игрок)
   ============================================================ */
async function ensureFakeUserForRealUser(real) {
  if (!real.userId) return null;

  const exists = await prisma.fakeUser.findUnique({
    where: { userId: real.userId },
  });

  if (exists) return exists;

  return prisma.fakeUser.create({
    data: {
      codename: real.username || `USER-${real.id}`,
      rank: "Field Operator",
      clearance: "D-13",
      bio: null,
      avatarUrl: real.avatarUrl || null,
      userId: real.userId,
    },
  });
}

/* ============================================================
   LOGIN — выдаёт JWT
   ============================================================ */
async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    /* ---------------------------------------------------------
       1) СИСТЕМНЫЙ USER (ADMIN / USER)
       --------------------------------------------------------- */
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const ok = await bcrypt.compare(password, user.password);

      if (ok) {
        await ensureFakeUserForSystemUser(user);

        const token = signSystemUserToken(user);

        console.log(`🟢 [User login] ${user.email} (${user.role})`);

        return res.json({
          message: "Logged in (system user)",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            realUser: null,
          },
          token,
        });
      }
    }

    /* ---------------------------------------------------------
       2) REALUSER (RenPy игрок)
       --------------------------------------------------------- */
    const real = await prisma.realUser.findFirst({
      where: { email, password },
    });

    if (real) {
      // обновляем онлайн-статус
      await prisma.realUser.update({
        where: { id: real.id },
        data: {
          is_online: true,
          last_seen: new Date(),
        },
      });

      await ensureFakeUserForRealUser(real);

      // получаем привязанного СИСТЕМНОГО USER
      const sysUser = await prisma.user.findUnique({
        where: { id: real.userId },
      });

      if (!sysUser) {
        return res.status(500).json({ error: "Broken realUser link" });
      }

      // 🔥 ПРАВИЛЬНЫЙ JWT ДЛЯ REALUSER:
      const token = jwt.sign(
        {
          id: sysUser.id,        // system user id
          realUserId: real.id,   // unique realUser id
          role: real.role || "RESEARCHER",
        },
        process.env.JWT_SECRET,
        { expiresIn: "12h" }
      );

      console.log(`🎮 [RealUser login] ${real.username}`);

      return res.json({
        message: "Logged in (real player)",
        user: {
          id: sysUser.id,       // system id (для привязки fakeUser)
          email: real.email,
          name: real.username,
          role: real.role || "RESEARCHER",

          realUser: {
            id: real.id,
            username: real.username,
          },
        },
        token,
      });
    }

    /* ---------------------------------------------------------
       3) Ошибочный логин
       --------------------------------------------------------- */
    return res.status(401).json({ error: "Invalid credentials" });

  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* ============================================================
   LOGOUT
   ============================================================ */
async function logout(req, res) {
  try {
    const realId = req.user?.realUserId;

    if (realId) {
      await prisma.realUser.update({
        where: { id: realId },
        data: { is_online: false },
      });
    }

    return res.json({ message: "Logged out — remove token clientside" });
  } catch (err) {
    console.error("❌ Logout error:", err);
    return res.status(500).json({ error: "Logout failed" });
  }
}

/* ============================================================
   FAKE REGISTER
   ============================================================ */
async function fakeRegister(req, res) {
  const { email } = req.body || {};
  let fileUrl = null;

  if (req.file) fileUrl = `/uploads/${req.file.filename}`;

  if (email) {
    await prisma.fakeApplication.create({
      data: { email, fileUrl },
    });
  }

  return res.status(202).json({
    message: "Ваша заявка успешно отправлена.",
  });
}

module.exports = { login, logout, fakeRegister };
