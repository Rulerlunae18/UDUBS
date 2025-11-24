const prisma = require("./prisma");
const fs = require("fs");
const path = require("path");

async function runSeedOnce() {
  const flagPath = path.join(__dirname, "../../.seed_done");

  if (fs.existsSync(flagPath)) {
    console.log("🟡 Seed уже выполнялся. Пропускаю.");
    return;
  }

  console.log("🟢 Запускаю seed.js на Render...");

  try {
    await require("../../prisma/seed.js"); // просто запускаем файл
    fs.writeFileSync(flagPath, "done");
    console.log("✨ Seed выполнен успешно!");
  } catch (err) {
    console.error("❌ Ошибка seed:", err);
  }
}

module.exports = { runSeedOnce };
