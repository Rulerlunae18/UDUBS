// backend/src/controllers/fakeusers.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const prisma = require("../utils/prisma");

// ------------------------------------------------------------
//  Настройка Multer
// ------------------------------------------------------------
const uploadDir = path.resolve("uploads/fakeusers");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ------------------------------------------------------------
//  GET /fakeusers — список всех NPC (публично)
// ------------------------------------------------------------
async function listFakeUsers(_req, res) {
  try {
    const users = await prisma.fakeUser.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    res.json(users);
  } catch (err) {
    console.error("❌ listFakeUsers error:", err);
    res.status(500).json({ error: "Failed to load NPC list" });
  }
}

// ------------------------------------------------------------
//  GET /fakeusers/:id — получить одного исследователя
// ------------------------------------------------------------
async function getFakeUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const user = await prisma.fakeUser.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!user) return res.status(404).json({ error: "Researcher not found" });

    res.json(user);
  } catch (err) {
    console.error("❌ getFakeUser error:", err);
    res.status(500).json({ error: "Failed to load researcher" });
  }
}

// ------------------------------------------------------------
//  GET /fakeusers/:id/posts — посты исследователя
// ------------------------------------------------------------
async function getFakeUserPosts(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const user = await prisma.fakeUser.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "Researcher not found" });

    res.json({ posts: user.posts });
  } catch (err) {
    console.error("❌ getFakeUserPosts error:", err);
    res.status(500).json({ error: "Failed to load posts" });
  }
}

// ------------------------------------------------------------
//  POST /fakeusers — создание NPC (ADMIN ONLY)
// ------------------------------------------------------------
async function createFakeUser(req, res) {
  try {
    // Авторизацию JWT мы проверяем в маршруте → req.user гарантированно есть
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { codename, rank, clearance, bio } = req.body;

    const avatarUrl = req.file
      ? `/uploads/fakeusers/${req.file.filename}`
      : null;

    const created = await prisma.fakeUser.create({
      data: {
        codename,
        rank,
        clearance,
        bio,
        avatarUrl,
        userId: null, // NPC не привязан к реальным пользователям
      },
    });

    res.json(created);
  } catch (err) {
    console.error("❌ createFakeUser error:", err);
    res.status(500).json({ error: "Failed to create NPC" });
  }
}

// ------------------------------------------------------------
//  PUT /fakeusers/:id — обновление NPC (ADMIN ONLY)
// ------------------------------------------------------------
async function updateFakeUser(req, res) {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const { codename, rank, clearance, bio } = req.body;

    // Если загружен файл — заменить avatarUrl
    const avatarUrl = req.file
      ? `/uploads/fakeusers/${req.file.filename}`
      : undefined;

    const data = {
      codename,
      rank,
      clearance,
      bio,
    };

    // avatarUrl добавляем ТОЛЬКО если файл есть
    if (avatarUrl) data.avatarUrl = avatarUrl;

    const updated = await prisma.fakeUser.update({
      where: { id },
      data,
    });

    res.json(updated);

  } catch (err) {
    console.error("❌ updateFakeUser error:", err);
    res.status(500).json({ error: "Failed to update NPC" });
  }
}


// ------------------------------------------------------------
//  DELETE /fakeusers/:id — удалить NPC (ADMIN ONLY)
// ------------------------------------------------------------
async function deleteFakeUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const user = await prisma.fakeUser.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Not found" });

    // защита — запрещено удалять slot для RealUser
    if (user.userId) {
      return res
        .status(400)
        .json({ error: "Cannot delete NPC linked to real user" });
    }

    await prisma.fakeUser.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ deleteFakeUser error:", err);
    res.status(500).json({ error: "Failed to delete NPC" });
  }
}

module.exports = {
  upload,
  listFakeUsers,
  createFakeUser,
  deleteFakeUser,
  getFakeUser,
  getFakeUserPosts,
  updateFakeUser,
};
