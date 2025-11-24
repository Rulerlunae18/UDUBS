// backend/src/routes/tg.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const TELEGRAM_TOKEN = process.env.TG_TOKEN;
const ADMIN_CHAT = process.env.TG_ADMIN_CHAT;

// Telegram версификационный секрет (КАСТОМНЫЙ)
const TG_WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET;

// ---- IP whitelist (официальные Telegram IP) ----
const TG_IP_RANGES = [
  /^149\.154\./,
  /^91\.108\./
];

// ---- SECURITY: check Telegram IP ----
function isFromTelegram(req) {
  const ip = req.ip || req.connection.remoteAddress || "";

  return TG_IP_RANGES.some((range) => range.test(ip));
}

// ---- SECURITY: check custom webhook secret ----
function checkSecret(req) {
  const header = req.headers["x-telegram-secret-token"];
  return header && TG_WEBHOOK_SECRET && header === TG_WEBHOOK_SECRET;
}

router.post("/webhook", async (req, res) => {
  try {
    // 1) Проверяем IP
    if (!isFromTelegram(req)) {
      console.warn("❌ BLOCKED NON-TG IP:", req.ip);
      return res.status(403).json({ error: "forbidden" });
    }

    // 2) Проверяем секрет
    if (!checkSecret(req)) {
      console.warn("❌ INVALID TG SECRET");
      return res.status(401).json({ error: "invalid secret" });
    }

    const update = req.body;
    console.log("📩 TG Update:", update);

    // ----- Messages -----
    if (update.message) {
      const text = update.message.text || "(no text)";
      const fromUser = update.message.from.username || update.message.from.id;

      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: ADMIN_CHAT,
          text: `📨 Сообщение от @${fromUser}: ${text}`
        }
      );
    }

    // ----- Edited messages -----
    if (update.edited_message) {
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: ADMIN_CHAT,
          text: `✏ Изменение сообщения:\n${update.edited_message.text}`
        }
      );
    }

    // ----- Callback buttons -----
    if (update.callback_query) {
      await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: ADMIN_CHAT,
          text: `🔘 Callback '${update.callback_query.data}' от @${update.callback_query.from.username}`
        }
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ TG Webhook Error:", err);
    res.sendStatus(500);
  }
});

module.exports = router;
