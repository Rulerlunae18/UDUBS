// middleware/auth.js
const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

// --------------------------------------------------
// Helper: extract Bearer token
// --------------------------------------------------
function extractToken(req) {
  const header = req.headers.authorization;
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

// --------------------------------------------------
// VERIFY TOKEN — правильный порядок
// --------------------------------------------------
async function verifyToken(req) {
  const token = extractToken(req);
  if (!token) return null;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }

  // ================================================
  // 1️⃣ REAL USER — проверяется ПЕРВЫМ
  // ================================================
  if (decoded.realUserId) {
    const real = await prisma.realUser.findUnique({
      where: { id: decoded.realUserId },
    });

    if (!real) return null;

    return {
      type: "real",
      id: real.id,
      role: "RESEARCHER",
      email: real.email,
      name: real.username,
      realUser: real,
      realUserId: real.id,
    };
  }

  // ================================================
  // 2️⃣ SYSTEM USER
  // ================================================
  const sysUser = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!sysUser) return null;

  return {
    type: "system",
    id: sysUser.id,
    role: sysUser.role,
    email: sysUser.email,
    name: sysUser.name,
  };
}

// --------------------------------------------------
async function authRequired(req, res, next) {
  const user = await verifyToken(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  req.user = user;
  next();
}

async function adminOnly(req, res, next) {
  const user = await verifyToken(req);
  if (!user || user.role !== "ADMIN")
    return res.status(403).json({ error: "Admin privileges required" });
  req.user = user;
  next();
}

module.exports = {
  authRequired,
  adminOnly,
};
