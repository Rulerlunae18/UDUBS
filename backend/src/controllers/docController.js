// backend/src/controllers/docs.js
const prisma = require("../utils/prisma");
const { publicUrl } = require("../services/storage");

/* ============================================================
   GET /docs — публичный список документов
   ============================================================ */
async function listDocs(_req, res) {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(docs);
  } catch (err) {
    console.error("❌ listDocs error:", err);
    res.status(500).json({ error: "Failed to load documents" });
  }
}

/* ============================================================
   GET /docs/:id — публичный доступ к документу
   ============================================================ */
async function getDoc(req, res) {
  try {
    const id = Number(req.params.id);
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(doc);
  } catch (err) {
    console.error("❌ getDoc error:", err);
    res.status(500).json({ error: "Failed to load document" });
  }
}

/* ============================================================
   POST /docs — создать документ (ADMIN ONLY)
   ============================================================ */
async function createDoc(req, res) {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "file required" });
    }

    const fileUrl = publicUrl(req.file.path);

    const created = await prisma.document.create({
      data: {
        title,
        description: description || null,
        fileUrl,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("❌ createDoc error:", err);
    res.status(500).json({ error: "Failed to create document" });
  }
}

/* ============================================================
   DELETE /docs/:id — удалить документ (ADMIN ONLY)
   ============================================================ */
async function deleteDoc(req, res) {
  try {
    const id = Number(req.params.id);

    await prisma.document.delete({ where: { id } });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("❌ deleteDoc error:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
}

module.exports = { listDocs, getDoc, createDoc, deleteDoc };
