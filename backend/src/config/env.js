require('dotenv').config();

let frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
let backend  = process.env.BACKEND_URL      || 'http://localhost:3000';
let uploadDir = process.env.UPLOAD_DIR      || 'uploads';

frontend = frontend.replace(/\/$/, "");
backend  = backend.replace(/\/$/, "");

const backendUrl = (path = "") => backend + path;

module.exports = {
    backend,
    frontend,
    backendUrl,
    uploadDir,
};
