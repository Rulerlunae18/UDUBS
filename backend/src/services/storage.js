// backend/src/services/storage.js
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

/* ============================================================
   🔥 SUPABASE ИНИЦИАЛИЗАЦИЯ
   ============================================================ */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ============================================================
   ⚙ MULTER: хранение файлов в памяти
   ============================================================ */
const upload = multer({
  storage: multer.memoryStorage(),           // !!!!! ВАЖНО !!!!!!
  limits: { fileSize: 50 * 1024 * 1024 },    // 50 MB
});

/* ============================================================
   ☁ Загрузка ФАЙЛА в SUPABASE STORAGE
   ============================================================ */
async function uploadToSupabase(file) {
  const fileName = `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error("Failed to upload file to Supabase");
  }

  // Публичный URL
  const publicUrl = supabase.storage
    .from("uploads")
    .getPublicUrl(fileName).data.publicUrl;

  return publicUrl;
}

module.exports = {
  upload,
  uploadToSupabase
};
