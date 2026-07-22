import axios from "axios";

export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// Yjs collaboration socket — the provider appends /<roomId>.
export const COLLAB_WS_URL = `${SERVER_URL.replace(/^http/, "ws")}/yjs`;

export const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
});

// Auth helpers — matches backend routes exactly
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/login", { email, password }),

  signup: (username: string, email: string, password: string) =>
    api.post("/signup", { username, email, password }),

  me: () => api.get("/me"),

  logout: () => api.post("/logout"),
};

// Room contents are loaded and saved over the collaboration socket, so the
// only room request left is code execution.
export const roomApi = {
  run: (code: string, language: string, input: string) =>
    api.post("/run", { code, language, input }),
};

// Google OAuth — backend redirect
export const GOOGLE_AUTH_URL = `${SERVER_URL}/auth/google`;
