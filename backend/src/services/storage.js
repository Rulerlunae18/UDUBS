// backend/src/services/storage.js
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Загружаем env-переменные заранее
require("dotenv").config();

/* ============================================================
   📁 ПУТЬ ДЛЯ ЗАГРУЗОК
   ============================================================ */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// Абсолютный путь (важно для Render!)
const absoluteUploadPath = path.join(__dirname, "..", "..", UPLOAD_DIR);

if (!fs.existsSync(absoluteUploadPath)) {
  console.log("📁 Creating upload directory:", absoluteUploadPath);
  fs.mkdirSync(absoluteUploadPath, { recursive: true });
}

/* ============================================================
   ⚙ Multer: Настройки хранения файлов
   ============================================================ */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, absoluteUploadPath);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

/* ============================================================
   🌐 publicUrl — отдаёт корректный путь для фронта
   ============================================================ */
function publicUrl(originalPath) {
  if (!originalPath) return null;

  const file = path.basename(originalPath);

  // важно: всегда относительный путь
  // чтобы Render / nginx / reverse proxy не ломали ссылки
  return `/${UPLOAD_DIR}/${file}`;
}

module.exports = {
  UPLOAD_DIR,
  absoluteUploadPath,
  upload,
  publicUrl
};
