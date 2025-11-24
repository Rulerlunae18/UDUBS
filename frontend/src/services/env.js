let backend;

// если dev-сервер Vite открыт по IP, берём его же
const currentHost = window.location.hostname;

// dev = всё, что не прод
if (import.meta.env.PROD) {
  backend = import.meta.env.VITE_BACKEND_URL;
} else {
  backend = `http://${currentHost}:3000`;
}


export const backendUrl = (path = "") => backend + path;
