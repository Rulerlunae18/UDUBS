require('dotenv').config();

let frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
let backend  = process.env.BACKEND_URL      || 'http://localhost:3000';

frontend = frontend.replace(/\/$/, "");
backend  = backend.replace(/\/$/, "");

const backendUrl = (path = "") => backend + path;

module.exports = {
    backend,
    frontend,
    backendUrl
};
