// backend/src/controllers/fakeusers.js
const prisma = require("../utils/prisma");
const { upload, uploadToSupabase } = require("../services/storage");

/* ============================================================
   GET /fakeusers — список всех NPC
   ============================================================ */
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

/* ============================================================
   GET /fakeusers/:id
   ============================================================ */
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

/* ============================================================
   GET /fakeusers/:id/posts
   ============================================================ */
async function getFakeUserPosts(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const user = await prisma.fakeUser.findUnique({
      where: { id },
      include: {
        posts: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!user) return res.status(404).json({ error: "Researcher not found" });

    res.json({ posts: user.posts });
  } catch (err) {
    console.error("❌ getFakeUserPosts error:", err);
    res.status(500).json({ error: "Failed to load posts" });
  }
}

/* ============================================================
   POST /fakeusers — создать NPC (ADMIN ONLY)
   ============================================================ */
async function createFakeUser(req, res) {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { codename, rank, clearance, bio } = req.body;

    let avatarUrl = null;

    if (req.file) {
      avatarUrl = await uploadToSupabase(
        req.file.path,
        req.file.filename,
        req.file.mimetype
      );
    }

    const created = await prisma.fakeUser.create({
      data: {
        codename,
        rank,
        clearance,
        bio,
        avatarUrl,
        userId: null,
      },
    });

    res.json(created);
  } catch (err) {
    console.error("❌ createFakeUser error:", err);
    res.status(500).json({ error: "Failed to create NPC" });
  }
}

/* ============================================================
   PUT /fakeusers/:id — обновить NPC (ADMIN ONLY)
   ============================================================ */
async function updateFakeUser(req, res) {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin only" });
    }

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const { codename, rank, clearance, bio } = req.body;

    const data = { codename, rank, clearance, bio };

    if (req.file) {
      const avatarUrl = await uploadToSupabase(
        req.file.path,
        req.file.filename,
        req.file.mimetype
      );
      data.avatarUrl = avatarUrl;
    }

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

/* ============================================================
   DELETE /fakeusers/:id
   ============================================================ */
async function deleteFakeUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const user = await prisma.fakeUser.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Not found" });

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
