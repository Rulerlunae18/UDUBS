// backend/src/controllers/viewController.js
const prisma = require("../utils/prisma");

/* ============================================================
   Добавить просмотр поста (гости + авторизованные)
   ============================================================ */
async function addView(req, res) {
  try {
    const postId = Number(req.params.id);
    const { sessionId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Записываем просмотр
    await prisma.view.create({
      data: {
        postId,
        sessionId
      }
    });

    // Обновляем количество просмотров
    const viewsCount = await prisma.view.count({
      where: { postId }
    });

    return res.json({ ok: true, viewsCount });
  } catch (err) {
    console.error("❌ addView error:", err);
    return res.status(500).json({ error: "Failed to record view" });
  }
}

module.exports = { addView };
