// backend/src/routes/archive.js
const express = require("express");
const router = express.Router();

const { listArchive } = require("../controllers/postController");

router.get("/", listArchive);

module.exports = router;
