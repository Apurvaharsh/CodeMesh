import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000",
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

// Room helpers
export const roomApi = {
  get: (roomId: string) => api.get(`/room/${roomId}`),

  save: (roomId: string, code: string, language: string) =>
    api.post("/save-room", { roomId, code, language }),

  run: (code: string, language: string, input: string) =>
    api.post("/run", { code, language, input }),
};

// Google OAuth — backend redirect
export const GOOGLE_AUTH_URL = "http://localhost:5000/auth/google";