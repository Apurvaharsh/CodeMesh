// ⚠️  Legacy shim — do NOT use this file for new code.
// All socket logic now lives in ./services/socket.ts (singleton).
// This shim re-exports the singleton instance so old components (App.tsx,
// LanguageSelector.tsx, CodeEditor.tsx) don't create a second connection.
import { getSocket } from "./services/socket";

// Named export `socket` — returns the singleton instance (same object every time)
export const socket = getSocket();