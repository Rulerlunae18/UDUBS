const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const uploadRoot = path.resolve("temp_uploads");

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
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const ext = path.extname(req.file.originalname).slice(1).toLowerCase();

    // Читаем файл в буфер
    const fileBuffer = fs.readFileSync(filePath);

    // Загружаем в Supabase
    const { data, error } = await supabase.storage
      .from('uploads')                // ← твой bucket
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: "Failed to upload to storage" });
    }

    // Получаем публичный URL
    const publicUrl = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName).data.publicUrl;

    // Чистим локальный временный файл
    fs.unlinkSync(filePath);

    res.json({
      url: publicUrl,       // ← ВАЖНО: теперь это URL на Supabase
      fileType: ext,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
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
