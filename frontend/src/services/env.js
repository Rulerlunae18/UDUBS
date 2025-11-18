let backend;

// если dev-сервер Vite открыт по IP, берём его же
const currentHost = window.location.hostname;

// dev = всё, что не прод
if (!import.meta.env.PROD) {
  backend = `http://${currentHost}:3000`;
} else {
  backend = "https://your-domain.com";
}

export const backendUrl = (path = "") => backend + path;
