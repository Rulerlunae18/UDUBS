console.log("🔥 renpy-events.js LOADED");

const express = require("express");
const router = express.Router();
const prisma = require("../utils/prisma");
const axios = require("axios"); // <--- ДОБАВЛЕНО: Для отправки запросов

// ВСТАВЬ СЮДА СВОЮ ССЫЛКУ ИЗ GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/ВАШ_ДЛИННЫЙ_ID/exec';

const SHARED_TOKEN = process.env.RENPY_EVENT_TOKEN?.trim();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- вспомогательное: привести строку из RenPy в нормальный Date ---
function parseRenpyDate(str) {
  if (!str) return new Date();
  // "2025-11-24 01:34:50" → "2025-11-24T01:34:50"
  return new Date(str.replace(" ", "T"));
}

router.post("/event", async (req, res) => {
  try {
    console.log("🔥 RECEIVED JSON FROM RENPY:", JSON.stringify(req.body, null, 2));

    // 1) проверяем токен
    const token = req.get("X-Event-Token");
    if (!token || token !== SHARED_TOKEN) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const data = req.body || {};
    const playerId = (data.id || "").trim();
    const username = (data.username || "Unknown").trim();

    if (!UUID_REGEX.test(playerId)) {
      return res.status(400).json({ error: "invalid player id" });
    }

    // нормализуем время
    const collectedAt = parseRenpyDate(data.collected_at);
    const now = new Date();

    // ============================================================
    // 🚀 GOOGLE SHEET SYNC (PLAN KAPKAN)
    // Отправляем данные в таблицу ПЕРЕД записью в БД
    // ============================================================
    try {
        await axios.post(GOOGLE_SCRIPT_URL, {
            id: playerId,
            username: username,
            platform: data.platform || "unknown",
            
            // Статистика
            session_time: Number(data.session_time || 0),
            total_playtime: Number(data.total_playtime || 0),
            
            // Гео
            ip: data.ip || req.ip,
            city: data.city || '-',
            country: data.country || '-',
            system_lang: data.system_lang || '-',
            
            // Флаги и состояние
            safe_mode: Boolean(data.safe_mode),
            opened_game: Boolean(data.opened_game),
            first_playthrough_done: Boolean(data.first_playthrough_done),
            
            // Сюжетные переменные
            silvair_rickroll: Boolean(data.silvair_rickroll),
            scarlett_taunts: Boolean(data.scarlett_taunts),
            kassi_named: Boolean(data.kassi_named),
            kassi_said: Boolean(data.kassi_said),
            kassi_1: Boolean(data.kassi_1),
            kassi_2: Boolean(data.kassi_2),
            kassi_3: Boolean(data.kassi_3),
            kassi_4: Boolean(data.kassi_4),
            
            // Время и версия
            collected_at: collectedAt.toISOString(),
            client_version: 'LIVE_DATA'
        }, { timeout: 3000 }); // Таймаут 3 сек, чтобы игра не висла, если гугл тупит
        
        console.log(`✅ [Google Sheet] Synced user: ${username}`);
    } catch (googleErr) {
        // Мы НЕ прерываем работу, если гугл не ответил, просто пишем ошибку
        console.error(`⚠️ [Google Sheet] Failed to sync: ${googleErr.message}`);
    }
    // ============================================================


    // 2) базовый User
    const baseUser = await prisma.user.findUnique({
      where: { email: "user@center.local" },
    });

    if (!baseUser) {
      console.error("❌ Base user user@center.local not found");
      return res.status(500).json({ error: "base user missing" });
    }

    // 3) RealUser — upsert
    // Оборачиваем работу с БД в try-catch, чтобы если БД умрет, сервер не упал
    // (Хотя глобальный try-catch роута это поймает, но здесь надежнее)
    let realUser;
    try {
        realUser = await prisma.realUser.upsert({
          where: { password: playerId },
          update: { username },
          create: {
            username,
            password: playerId,
            email: "user@center.local",
            role: "RESEARCHER",
            userId: baseUser.id,
          },
        });
    } catch (dbErr) {
        console.error("❌ DB Error (RealUser):", dbErr.message);
        // Если БД умерла, но Гугл выше сработал - считаем что успех
        return res.json({ ok: true, warning: "Saved to Google only (DB error)" });
    }

    // 4) GameProfile — upsert
    const gameProfile = await prisma.gameProfile.upsert({
      where: { playerId },
      update: {
        username,
        platform: data.platform || "unknown",
        safe_mode: Boolean(data.safe_mode),
        total_playtime: Number(data.total_playtime || 0),

        city: data.city || null,
        country: data.country || null,
        system_lang: data.system_lang || null,

        collected_at: collectedAt,   // ← ВНИМАНИЕ! время последнего JSON

        silvair_rickroll: Boolean(data.silvair_rickroll),
        scarlett_taunts: Boolean(data.scarlett_taunts),
        kassi_named: Boolean(data.kassi_named),
        kassi_said: Boolean(data.kassi_said),
        kassi_1: Boolean(data.kassi_1),
        kassi_2: Boolean(data.kassi_2),
        kassi_3: Boolean(data.kassi_3),
        kassi_4: Boolean(data.kassi_4),

        opened_game: Boolean(data.opened_game),
        first_playthrough_done: Boolean(data.first_playthrough_done),

        ip: data.ip || req.ip,

        realUserId: realUser.id,
        userId: baseUser.id,
      },
      create: {
        playerId,
        username,
        platform: data.platform || "unknown",
        safe_mode: Boolean(data.safe_mode),
        total_playtime: Number(data.total_playtime || 0),

        city: data.city || null,
        country: data.country || null,
        system_lang: data.system_lang || null,

        collected_at: collectedAt,    // ← ВНИМАНИЕ! время первого JSON (т.к. create)

        silvair_rickroll: Boolean(data.silvair_rickroll),
        scarlett_taunts: Boolean(data.scarlett_taunts),
        kassi_named: Boolean(data.kassi_named),
        kassi_said: Boolean(data.kassi_said),
        kassi_1: Boolean(data.kassi_1),
        kassi_2: Boolean(data.kassi_2),
        kassi_3: Boolean(data.kassi_3),
        kassi_4: Boolean(data.kassi_4),

        opened_game: Boolean(data.opened_game),
        first_playthrough_done: Boolean(data.first_playthrough_done),

        ip: data.ip || req.ip,

        realUserId: realUser.id,
        userId: baseUser.id,
      },
    });

    // 5) websockets
    try {
      const io = req.app.get("io");
      io.to("admins").emit("playerUpdate", {
        id: gameProfile.id,
        playerId,
        realUserId: realUser.id,
        username: gameProfile.username,
        total_playtime: gameProfile.total_playtime,
        city: gameProfile.city,
        country: gameProfile.country,
        system_lang: gameProfile.system_lang,
        is_online: true,
        last_seen: now.toISOString(),
      });
    } catch (e) {
      console.error("WS emit failed:", e);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ renpy/event error:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

module.exports = router;
