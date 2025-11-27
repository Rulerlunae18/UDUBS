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
   ============================================================ */
async function uploadToSupabase(file, filename = null, mimetype = null) {
  let fileName, buffer, type;

  // 🟢 РЕЖИМ 1 — Multer (req.file)
  if (file?.buffer) {
    fileName = `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`;
    buffer = file.buffer;
    type = file.mimetype;
  }

  // 🟡 РЕЖИМ 2 — вручную: (path + filename + mimetype)
  else if (typeof file === "string" && filename && mimetype) {
    buffer = fs.readFileSync(file);
    fileName = `${Date.now()}-${filename.replace(/[^\w.-]/g, "_")}`;
    type = mimetype;
  }

  // 🔴 Ошибка — неправильные аргументы
  else {
    throw new Error("uploadToSupabase: invalid input — send req.file OR path+filename+mimetype");
  }

  /* === ЗАГРУЗКА В SUPABASE === */
  const { error } = await supabase.storage
    .from("uploads")
    .upload(fileName, buffer, {
      upsert: true,
      contentType: type,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error("Failed to upload file to Supabase");
  }

  return supabase.storage.from("uploads").getPublicUrl(fileName).data.publicUrl;
}

module.exports = { upload, uploadToSupabase };
