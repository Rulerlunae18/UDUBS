const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

/** Логирование опасных токенов */
function logTokenEvent(type, meta = {}) {
  try {
    const p = path.join(__dirname, "..", "security.log");
    const line = `[${new Date().toISOString()}] [${type}] ${JSON.stringify(meta)}\n`;
    fs.appendFileSync(p, line);
  } catch {}
}

/**
 * JWT Auth Middleware
 * @param {boolean} required — если false, токен не обязателен
 */
function jwtAuth(required = true) {
  return (req, res, next) => {
    let token = null;

    // 1. Authorization header
    const auth = req.headers["authorization"];
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.split(" ")[1];
    }

    // 2. Token from query (?token=...)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    // 3. No token
    if (!token) {
      if (!required) return next();
      return res.status(401).json({ error: "NO_TOKEN" });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // sanity check
      if (!payload.id || !payload.role) {
        logTokenEvent("INVALID_PAYLOAD", {
          ip: req.ip,
          ua: req.headers["user-agent"],
          payload
        });
        return res.status(401).json({ error: "INVALID_PAYLOAD" });
      }

      req.user = payload;
      return next();

    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "TOKEN_EXPIRED" });
      }

      logTokenEvent("BAD_TOKEN", {
        ip: req.ip,
        ua: req.headers["user-agent"],
        token
      });

      return res.status(401).json({ error: "TOKEN_INVALID" });
    }
  };
}

/** Admin role guard */
function adminOnly(req, res, next) {
  if (req.user?.role === "ADMIN") return next();
  return res.status(403).json({ error: "ADMIN_ONLY" });
}

module.exports = { jwtAuth, adminOnly };
