// backend/src/routes/speedtest.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const { Readable } = require("stream");

const router = express.Router();

// 🚧 Защита от злоупотреблений
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 сек окно
  max: 5,              // не больше 5 запросов
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many speedtest requests" }
});

router.use(limiter);

// === STREAM GENERATOR ===
function streamBytes(bytes) {
  return new Readable({
    read() {
      if (bytes <= 0) return this.push(null);

      // 64 KB чанки — оптимально
      const chunkSize = Math.min(bytes, 64 * 1024);
      const chunk = Buffer.alloc(chunkSize, 0x5A);

      bytes -= chunkSize;
      this.push(chunk);
    }
  });
}

// === DOWNLOAD TEST ===
router.get("/download", (req, res) => {
  let mb = Number(req.query.sizeMb) || 5;

  // ограничим размер, чтобы Render не страдал
  mb = Math.max(1, Math.min(mb, 200)); // 1–200 MB

  const bytes = mb * 1024 * 1024;

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Disposition", "attachment; filename=\"speedtest.bin\"");

  streamBytes(bytes).pipe(res);
});

// === UPLOAD TEST ===
router.post(
  "/upload",
  express.raw({ type: "*/*", limit: "300mb" }),
  (req, res) => {
    res.json({
      ok: true,
      receivedBytes: req.body?.length || 0
    });
  }
);

module.exports = router;
