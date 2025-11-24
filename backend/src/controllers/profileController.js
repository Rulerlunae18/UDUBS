// backend/src/controllers/profileController.js
const prisma = require("../utils/prisma");
const { publicUrl } = require("../services/storage");

/* ============================================================
   📌 Получить профиль User
   Доступ:
   - ADMIN — любой профиль
   - USER — только свой
   ============================================================ */
async function getProfile(req, res) {
  try {
    const id = Number(req.params.id);

    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // USER может смотреть только себя
    if (req.user.role !== "ADMIN" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        realUsers: true,
        gameProfiles: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
}

/* ============================================================
   📌 Обновить профиль User + Синхронизировать FakeUser
   Доступ:
   - ADMIN — может редактировать любые профили
   - USER — только свой
   ============================================================ */
async function updateProfile(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, title, bio } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // USER не может редактировать чужие профили
    if (req.user.role !== "ADMIN" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    let avatarUrl = user.avatarUrl;
    if (req.file) avatarUrl = publicUrl(req.file.path);

    // =====================================================
    // 🔹 USER → может менять ТОЛЬКО АВАТАРКУ
    // =====================================================
    if (req.user.role !== "ADMIN") {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { avatarUrl },
      });

      return res.json({
        message: "Avatar updated",
        user: updatedUser,
      });
    }

    // =====================================================
    // 🔹 ADMIN → может менять ВСЁ
    // =====================================================
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, title, bio, avatarUrl },
    });

    // Обновляем связанные FakeUser (только у Admin)
    await prisma.fakeUser.updateMany({
      where: { userId: id },
      data: {
        codename: updatedUser.name,
        rank: updatedUser.title,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatarUrl,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

/* ============================================================
   📌 Получить всех пользователей
   Доступ: ADMIN
   ============================================================ */
async function listUsers(req, res) {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        realUsers: true,
        gameProfiles: true,
      },
    });

    res.json(users);
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
}

/* ============================================================
   📌 Удалить пользователя целиком (опасная операция)
   Доступ: ADMIN
   ============================================================ */
async function deleteUser(req, res) {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const id = Number(req.params.id);

    await prisma.fakeUser.deleteMany({ where: { userId: id } });
    await prisma.realUser.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  listUsers,
  deleteUser,
};
