// backend/src/services/storage.js
const fs = require("fs");
const path = require("path");
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
   📁 ВРЕМЕННАЯ ПАПКА (ТОЛЬКО ДЛЯ Multer)
   ============================================================ */
const TEMP_DIR = path.resolve("temp_uploads");

if (!fs.existsSync(TEMP_DIR)) {
  console.log("📁 Creating temp directory:", TEMP_DIR);
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/* ============================================================
   ⚙ Multer: временное сохранение файлов
   ============================================================ */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/[^\w.-]/g, "_");
    cb(null, safe);
  }
});

const upload = multer({ storage });

/* ============================================================
   ☁ Загрузка ФАЙЛА в SUPABASE STORAGE
   ============================================================ */
async function uploadToSupabase(localPath, fileName, mime) {
  const fileBuffer = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from("uploads")
    .upload(fileName, fileBuffer, {
      contentType: mime,
      upsert: true
    });

  if (error) throw error;

  // Удаляем временный файл
  fs.unlinkSync(localPath);

  // Генерируем публичный URL
  return supabase.storage
    .from("uploads")
    .getPublicUrl(fileName).data.publicUrl;
}

module.exports = {
  upload,
  uploadToSupabase
};
