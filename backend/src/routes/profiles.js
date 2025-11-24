// backend/src/routes/profiles.js
const express = require("express");
const { authRequired, adminOnly } = require("../middleware/auth");
const { upload } = require("../services/storage");

const {
  listUsers,
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

const router = express.Router();

/* ============================================================
   🔐 Все маршруты требуют JWT
   ============================================================ */
router.use(authRequired);

/* ============================================================
   👁‍🗨 GET /profiles — доступно только администратору
   ============================================================ */
router.get("/", adminOnly, listUsers);

/* ============================================================
   👁‍🗨 GET /profiles/:id
   ADMIN → видит всех
   USER  → может видеть только свой профиль
   ============================================================ */
router.get("/:id", async (req, res, next) => {
  const requestedId = Number(req.params.id);
  const user = req.user;

  // Админ — всегда можно
  if (user.role === "ADMIN") return getProfile(req, res, next);

  // Обычный пользователь — видит только свой профиль
  if (user.id !== requestedId) {
    return res.status(403).json({ error: "Access denied" });
  }

  return getProfile(req, res, next);
});

/* ============================================================
   🛠 PUT /profiles/:id — обновление профиля (ТОЛЬКО АДМИН)
   ============================================================ */
router.put(
  "/:id",
  upload.single("avatar"),
  async (req, res, next) => {
    const requestedId = Number(req.params.id);
    const user = req.user;

    // ADMIN — может менять всё
    if (user.role === "ADMIN") {
      return updateProfile(req, res, next);
    }

    // USER — может менять ТОЛЬКО свой профиль
    if (user.id !== requestedId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // USER — может менять ТОЛЬКО аватар
    if (req.body.name || req.body.title || req.body.bio) {
      return res.status(403).json({ error: "Users can update avatar only" });
    }

    return updateProfile(req, res, next);
  }
);

module.exports = router;
