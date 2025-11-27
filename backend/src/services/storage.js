// backend/src/services/storage.js
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config();

/* ============================================================
   🔥 SUPABASE ИНИЦИАЛИЗАЦИЯ
   ============================================================ */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ============================================================
   ⚙ MULTER: файлы хранятся в памяти (buffer)
   ============================================================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

/* ============================================================
   ☁ Загрузка файла в Supabase
   Работает в двух форматах:
   1) uploadToSupabase(req.file)
   2) uploadToSupabase(path, filename, mimetype)
   ============================================================ */async function uploadToSupabase(file, filename = null, mimetype = null) {
  // Если ничего не передали → считаем что аватар не загружается сейчас
  if (!file && !filename) {
    console.warn("uploadToSupabase: no file provided — skipping upload");
    return null; // ⬅ вместо throw!
  }

  let fileName, buffer, type;

  /* ============================================================
     MODE 1 — MemoryStorage (req.file)
  ============================================================ */
  if (file?.buffer) {
    fileName = `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`;
    buffer = file.buffer;
    type = file.mimetype;
  }

  /* ============================================================
     MODE 2 — old format: path + filename + mimetype
  ============================================================ */
  else if (typeof file === "string" && filename && mimetype) {
    const fs = require("fs");
    buffer = fs.readFileSync(file);
    fileName = `${Date.now()}-${filename.replace(/[^\w.-]/g, "_")}`;
    type = mimetype;
  }

  else {
    console.warn("uploadToSupabase: unexpected arguments — skipping upload");
    return null; // ⬅ вместо throw!
  }

  /* ============================================================
     Upload to Supabase
  ============================================================ */
  const { error } = await supabase.storage
    .from("uploads")
    .upload(fileName, buffer, { upsert: true, contentType: type });

  if (error) {
    console.error("Supabase upload error:", error);
    return null; // ⬅ теперь backend не упадёт
  }

  return supabase.storage.from("uploads").getPublicUrl(fileName).data.publicUrl;
}
module.exports = { upload, uploadToSupabase };
