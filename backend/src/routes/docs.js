// backend/src/routes/docs.js

const express = require('express');
const router = express.Router();

const { authRequired, adminOnly } = require('../middleware/auth');
const { upload } = require('../services/storage');

const {
  listDocs,
  getDoc,
  createDoc,
  deleteDoc
} = require('../controllers/docController');

// 🔐 Все роуты документов требуют авторизации
router.use(authRequired);

// 📄 Получить список документов
router.get('/', listDocs);

// 📄 Получить один документ
router.get('/:id', getDoc);

// 🛡 Только админ может создать документ (с загрузкой файла)
router.post('/', adminOnly, upload.single('file'), createDoc);

// 🛡 Только админ может удалить
router.delete('/:id', adminOnly, deleteDoc);

module.exports = router;
