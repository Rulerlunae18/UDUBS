// ======================================================
//   ARG-Portal Backend — JWT SECURITY EDITION
// ======================================================

console.log("CURRENT DIR:", __dirname);

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const http = require('http');
const fetch = require("node-fetch");
const { Server } = require('socket.io');
const prisma = require('./utils/prisma');

const config = require('./config/env');
const { attachUser } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errors');

// FRONTEND ORIGINS
const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",")
  : ["http://localhost:5173"];

console.log("Allowed origins:", allowedOrigins);

// Telegram security logging
async function tg(message) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: message })
  });
}

function logSecurity(msg, req = {}) {
  const ip = req.ip || "n/a";
  const ua = req.headers?.["user-agent"] || "n/a";
  const url = req.originalUrl || "";

  const line = `[${new Date().toISOString()}] ${msg} | IP=${ip} | UA=${ua} | URL=${url}\n`;
  fs.appendFileSync(path.join(__dirname, "../security.log"), line);
  console.warn(line.trim());

  tg(`⚠️ SECURITY ALERT\n${msg}\nIP: ${ip}\nUA: ${ua}\nURL: ${url}`).catch(() => {});
}

// Routers
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const viewRoutes = require('./routes/views');
const docRoutes = require('./routes/docs');
const profileRoutes = require('./routes/profiles');
const archiveRoutes = require('./routes/archive');
const uploadsRoutes = require('./routes/uploads');
const speedtestRoutes = require('./routes/speedtest');
const fakeUsersRoutes = require('./routes/fakeusers');
const renpyRoutes = require('./routes/renpy-events');
const adminPlayerRoutes = require('./routes/admin-players');
const realUsersRoutes = require('./routes/real-users');
const realUsersSelfRoutes = require('./routes/realusers-self');
const tgRoutes = require('./routes/tg');

const app = express();

app.set('trust proxy', 1);

// ======================================================
//   GLOBAL SECURITY & BASE MIDDLEWARE
// ======================================================

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "connect-src": ["'self'", ...allowedOrigins],
        "frame-ancestors": ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: { error: "Rate limit exceeded." },
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("CORS blocked: " + origin));
    },
  })
);

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "microphone=(), camera=(), geolocation=()");
  next();
});

// ======================================================
//   UPLOADS + HONEYPOT
// ======================================================
app.use(
  "/uploads",
  helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
  express.static(path.join(__dirname, "../uploads"), {
    index: false,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath);
      if ([".html", ".js", ".php", ".sh", ".exe"].includes(ext)) {
        logSecurity(`🚫 Blocked dangerous download: ${path.basename(filePath)}`);
        res.setHeader("X-Content-Type-Options", "nosniff");
      }
    },
  })
);

app.get("/uploads/admin_panel_access.php", (req, res) => {
  logSecurity("🕷 Honeypot triggered", req);
  return res.status(403).json({ error: "honeypot" });
});

// ======================================================
//   ROUTES
// ======================================================

app.use("/api/uploads", uploadsRoutes);
app.use('/uploads', express.static(path.resolve(config.uploadDir)));
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/views", viewRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/speedtest", speedtestRoutes);
app.use("/api/fakeusers", fakeUsersRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/renpy", renpyRoutes);
app.use("/api/realusers", realUsersRoutes);
app.use("/api/realusers-self", realUsersSelfRoutes);
app.use("/api/admin", adminPlayerRoutes); // adminOnly стоит в самом роуте
app.use("/api/tg", tgRoutes);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

// ======================================================
//   SOCKET.IO
// ======================================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: socketAllowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

app.set("io", io);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on("realuser:online", async (id) => {
    if (!id) return;

    try {
      await prisma.realUser.update({
        where: { id },
        data: { is_online: true, last_seen: new Date() },
      });
      onlineUsers.set(socket.id, id);
    } catch (e) {
      logSecurity("❌ Failed to set real user online", {});
    }
  });

  socket.on("disconnect", async () => {
    const id = onlineUsers.get(socket.id);
    if (id) {
      await prisma.realUser.update({
        where: { id },
        data: { is_online: false },
      });
      onlineUsers.delete(socket.id);
    }
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// ======================================================
//   START SERVER
// ======================================================
server.listen(config.port || 3000, () => {
  console.log(`🚀 SECURE ARG Portal running on port ${config.port || 3000}`);
  console.log(`Allowed origins:`, config.frontendOrigin);
});
