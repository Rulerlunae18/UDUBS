// backend/src/routes/views.js
const express = require("express");
const { addView } = require("../controllers/viewController");

const router = express.Router();

// POST /api/views/:id
// 👁 Добавить просмотр поста
// ⚠️ Доступен всем — даже без авторизации
router.post("/:id", async (req, res) => {
  try {
    await addView(req, res);
  } catch (err) {
    console.error("❌ Error in /views/:id:", err);
    res.status(500).json({ error: "Failed to add view" });
  }
});

module.exports = router;
