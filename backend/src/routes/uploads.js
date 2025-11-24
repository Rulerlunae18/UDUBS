const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

const router = express.Router();

const uploadRoot = path.resolve(config.uploadDir || "uploads");

// гарантируем, что папка существует
if (!fs.existsSync(uploadRoot)) {
  console.log("📁 Creating upload directory:", uploadRoot);
  fs.mkdirSync(uploadRoot, { recursive: true });
}

// Multer: безопасное хранение
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/[^\w.-]/g, "_");
    cb(null, safe);
  }
});

const allowedExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.docx', '.txt'];

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Загрузка файла
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const ext = path.extname(req.file.originalname).slice(1).toLowerCase();

  res.json({
    path: `/uploads/${req.file.filename}`,
    fileType: ext,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// Проверка API
router.get('/ping', (_req, res) => res.json({ online: true }));

// Обработка ошибок
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.warn("Upload error:", err);
    return res.status(400).json({ error: err.message || "Upload failed" });
  }
  next();
});

module.exports = router;
