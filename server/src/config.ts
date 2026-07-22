// Must be imported before anything that reads process.env at module load.
import "dotenv/config";

const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error("Copy .env.example to .env and fill in the values.");
    process.exit(1);
  }

  return value;
};

export const JWT_SECRET = requireEnv("JWT_SECRET");
export const SESSION_SECRET = requireEnv("SESSION_SECRET");

export const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
export const port = Number(process.env.PORT) || 5000;
export const judge0Url =
  process.env.JUDGE0_URL ||
  "http://127.0.0.1:2358/submissions?base64_encoded=false&wait=true";

// Null when unconfigured, so callers get narrowed non-optional strings rather
// than having to assert them.
export const googleAuth =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl:
          process.env.GOOGLE_CALLBACK_URL ||
          `http://localhost:${port}/auth/google/callback`,
      }
    : null;

// Path the Yjs collaboration websocket is served on, e.g. /yjs/<roomId>
export const COLLAB_PATH = "/yjs";
