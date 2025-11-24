// backend/src/routes/posts.js
const express = require('express');
const { authRequired, adminOnly } = require('../middleware/auth');
const { upload } = require('../services/storage');

const {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  listArchive,
  addView
} = require('../controllers/postController');

const router = express.Router();

/* ============================================================
   🔓 Публичные маршруты (не требуют JWT)
   ============================================================ */

// Анонимный просмотр — нужен всем
router.post('/:id/view', addView);

/* ============================================================
   🔐 Авторизованные маршруты
   ============================================================ */

router.use(authRequired);

// Архив доступен любому залогиненному
router.get('/archive', listArchive);

// Список постов
router.get('/', listPosts);

// Конкретный пост (с подменой автора если это слот игрока)
router.get('/:id', getPost);

/* ============================================================
   🛡 Админские операции
   ============================================================ */

router.post('/', adminOnly, upload.single('cover'), createPost);

router.put('/:id', adminOnly, upload.single('cover'), updatePost);

router.delete('/:id', adminOnly, deletePost);

module.exports = router;
