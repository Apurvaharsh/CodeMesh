import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import type { editor as MonacoEditorNS } from "monaco-editor";
import { useAuth } from "../context/AuthContext";
// Side-effect import: points @monaco-editor/react at the bundled monaco.
import "../services/monaco";
import { roomApi, COLLAB_WS_URL } from "../services/api";
import { getSocket } from "../services/socket";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", icon: "🟨" },
  { value: "typescript", label: "TypeScript", icon: "🔷" },
  { value: "python", label: "Python", icon: "🐍" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "cpp", label: "C++", icon: "⚙️" },
  { value: "c", label: "C", icon: "🔵" },
];

// Shared Yjs type keys — these MUST match the server (see collab.ts).
const TEXT_KEY = "monaco";
const META_KEY = "meta";

interface ConnectedUser {
  clientId: number;
  username: string;
  color: string;
  isSelf: boolean;
}

const USER_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ec4899", "#6366f1",
];

const debugRealtime = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.debug("[codemesh-realtime]", ...args);
  }
};

const EditorRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = getSocket();

  const [language, setLanguage] = useState("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isError, setIsError] = useState(false);
  const [running, setRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<"output" | "input">("output");
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // The Yjs document and its transport. Held in state (not a ref) so the
  // binding effect re-runs when they are replaced.
  const [collab, setCollab] = useState<{
    doc: Y.Doc;
    provider: WebsocketProvider;
  } | null>(null);
  const [editor, setEditor] =
    useState<MonacoEditorNS.IStandaloneCodeEditor | null>(null);

  const [myColor] = useState(
    () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  );
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const username = user?.username || localStorage.getItem("username") || "Guest";

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Yjs document + transport ────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(COLLAB_WS_URL, roomId, doc);

    provider.awareness.setLocalStateField("user", {
      name: username,
      color: myColor,
    });

    const handleStatus = ({ status }: { status: string }) => {
      debugRealtime("collab status", { roomId, status });
      setReconnecting(status !== "connected");
    };

    provider.on("status", handleStatus);
    setCollab({ doc, provider });

    return () => {
      provider.off("status", handleStatus);
      provider.destroy();
      doc.destroy();
      setCollab(null);
    };
  }, [roomId, username, myColor]);

  // ─── Bind the document to the editor ─────────────────────────
  useEffect(() => {
    if (!collab || !editor) return;

    const model = editor.getModel();
    if (!model) return;

    const binding = new MonacoBinding(
      collab.doc.getText(TEXT_KEY),
      model,
      new Set([editor]),
      collab.provider.awareness
    );

    debugRealtime("monaco bound", { roomId });

    return () => binding.destroy();
  }, [collab, editor, roomId]);

  // ─── Language, shared through the document ───────────────────
  useEffect(() => {
    if (!collab) return;

    const meta = collab.doc.getMap(META_KEY);

    const syncLanguage = () => {
      const next = meta.get("language");
      if (typeof next === "string") {
        setLanguage(next);
      }
    };

    syncLanguage();
    meta.observe(syncLanguage);

    return () => meta.unobserve(syncLanguage);
  }, [collab]);

  // ─── Presence and remote cursor colors, from awareness ───────
  useEffect(() => {
    if (!collab) return;

    const { awareness } = collab.provider;
    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);

    let knownNames = new Map<number, string>();
    let isFirstUpdate = true;

    const handleAwareness = () => {
      const states = awareness.getStates();

      const users: ConnectedUser[] = [];
      const rules: string[] = [];

      states.forEach((state, clientId) => {
        const info = (state as { user?: { name?: string; color?: string } })
          .user;
        const name = info?.name || "Guest";
        const color =
          info?.color || USER_COLORS[clientId % USER_COLORS.length] || "#3b82f6";

        users.push({
          clientId,
          username: name,
          color,
          isSelf: clientId === awareness.clientID,
        });

        if (clientId !== awareness.clientID) {
          // y-monaco emits per-client class names but no colors, so the
          // caret and selection styling is supplied here.
          rules.push(
            `.yRemoteSelection-${clientId} { background-color: ${color}33; }`,
            `.yRemoteSelectionHead-${clientId} { border-left: 2px solid ${color}; border-top: 2px solid ${color}; }`,
            `.yRemoteSelectionHead-${clientId}::after { background-color: ${color}; content: ${JSON.stringify(name)}; }`
          );
        }
      });

      styleEl.textContent = rules.join("\n");
      setConnectedUsers(users);

      // Announce arrivals and departures, skipping the initial snapshot.
      const nextNames = new Map(
        users.map((entry) => [entry.clientId, entry.username])
      );

      if (!isFirstUpdate) {
        nextNames.forEach((name, clientId) => {
          if (!knownNames.has(clientId) && clientId !== awareness.clientID) {
            showToast(`${name} joined`);
          }
        });
        knownNames.forEach((name, clientId) => {
          if (!nextNames.has(clientId)) {
            showToast(`${name} left`);
          }
        });
      }

      knownNames = nextNames;
      isFirstUpdate = false;
    };

    handleAwareness();
    awareness.on("change", handleAwareness);

    return () => {
      awareness.off("change", handleAwareness);
      styleEl.remove();
    };
  }, [collab, showToast]);

  // ─── Save status ─────────────────────────────────────────────
  // The server owns persistence; it emits room-saved once the debounce
  // has flushed to Postgres.
  useEffect(() => {
    if (!collab) return;

    const handleUpdate = () => {
      setSaveStatus("unsaved");

      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      savingTimerRef.current = setTimeout(() => setSaveStatus("saving"), 2000);
    };

    collab.doc.on("update", handleUpdate);

    return () => {
      collab.doc.off("update", handleUpdate);
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    };
  }, [collab]);

  // ─── Socket.IO: run output + save notifications only ─────────
  useEffect(() => {
    if (!roomId) return;

    const handleReceiveOutput = (out: string) => {
      setOutput(out);
      setIsError(false);
    };
    const handleRoomSaved = () => {
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      setSaveStatus("saved");
    };
    const joinRoom = () => socket.emit("join-room", { roomId });

    socket.on("receive-output", handleReceiveOutput);
    socket.on("room-saved", handleRoomSaved);
    socket.on("connect", joinRoom);

    if (socket.connected) joinRoom();

    return () => {
      socket.emit("leave-room", { roomId });
      socket.off("receive-output", handleReceiveOutput);
      socket.off("room-saved", handleRoomSaved);
      socket.off("connect", joinRoom);
    };
  }, [roomId, socket]);

  // Track the room locally for the dashboard's recent list.
  useEffect(() => {
    if (!roomId) return;

    const stored = localStorage.getItem("codemesh_recent_rooms");
    let rooms = [];
    try { rooms = stored ? JSON.parse(stored) : []; } catch { rooms = []; }
    const updated = [
      { room_id: roomId, language, updated_at: new Date().toISOString() },
      ...rooms.filter((r: any) => r.room_id !== roomId),
    ].slice(0, 10);
    localStorage.setItem("codemesh_recent_rooms", JSON.stringify(updated));
  }, [roomId, language]);

  const handleLanguageChange = (lang: string) => {
    // Written to the document so every client follows, including late joiners.
    collab?.doc.getMap(META_KEY).set("language", lang);
    setLanguage(lang);
  };

  const runCode = async () => {
    const code = collab?.doc.getText(TEXT_KEY).toString() ?? "";

    setRunning(true);
    setOutput("");
    setIsError(false);
    setOutputTab("output");

    try {
      const res = await roomApi.run(code, language, input);
      const out = res.data.output || "No output";
      setOutput(out);
      socket.emit("send-output", { roomId, output: out });
    } catch (err: any) {
      setIsError(true);
      setOutput(err?.response?.data?.output || "Execution failed.");
    } finally {
      setRunning(false);
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Room link copied to clipboard!");
  };

  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const langInfo = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];
  const others = connectedUsers.filter((entry) => !entry.isSelf);
  const userCount = connectedUsers.length || 1;

  const saveIndicator = {
    saved: { color: "text-green-400", icon: "✓", label: "Saved" },
    saving: { color: "text-yellow-400", icon: "◌", label: "Saving…" },
    unsaved: { color: "text-slate-500", icon: "●", label: "Unsaved" },
  }[saveStatus];

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-white overflow-hidden">
      {/* Reconnecting Banner */}
      {reconnecting && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center text-xs text-yellow-300 flex items-center justify-center gap-2">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Reconnecting to server…
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-dark rounded-xl px-4 py-2.5 text-sm text-white border border-white/10 shadow-xl animate-slide-up flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          {toast}
        </div>
      )}

      {/* ── TOP BAR ── */}
      <header className="flex-shrink-0 h-12 flex items-center gap-3 px-3 border-b border-white/5"
        style={{ background: "rgba(13,17,27,0.98)" }}>

        {/* Logo + Room ID */}
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="relative z-10 text-white font-bold text-[10px] font-mono">CM</span>
          </div>
          <span className="text-white font-semibold text-sm hidden sm:block">CodeMesh</span>
        </button>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 text-xs">Room:</span>
          <code className="text-blue-400 text-xs font-mono bg-blue-500/10 px-2 py-0.5 rounded">{roomId}</code>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save status */}
        <div className={`hidden sm:flex items-center gap-1.5 text-xs ${saveIndicator.color}`}>
          <span>{saveIndicator.icon}</span>
          <span>{saveIndicator.label}</span>
        </div>

        {/* User count */}
        <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {userCount} online
        </div>

        {/* Language selector */}
        <div className="relative">
          <select
            id="editor-language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="glass rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none border border-white/8 hover:border-white/20 transition-colors appearance-none cursor-pointer"
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value} style={{ background: "#0d1117" }}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
            {langInfo.icon}
          </span>
        </div>

        {/* Copy Invite */}
        <button
          id="editor-copy-invite"
          onClick={copyInvite}
          className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-lg"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="hidden sm:inline">Invite</span>
        </button>

        {/* Run */}
        <button
          id="editor-run"
          onClick={runCode}
          disabled={running}
          className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 rounded-lg disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          {running ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin relative z-10" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="relative z-10">Running</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span className="relative z-10">Run</span>
            </>
          )}
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            id="editor-profile"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white hover:ring-2 hover:ring-blue-500/50 transition-all"
            style={{ background: myColor }}
          >
            {initials(username)}
          </button>
          {profileMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-44 glass-dark rounded-xl border border-white/8 shadow-xl py-1.5 z-50">
              <div className="px-3 py-2 border-b border-white/5">
                <div className="text-xs font-medium text-white truncate">{username}</div>
              </div>
              <button onClick={() => navigate("/dashboard")}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Dashboard
              </button>
              <button onClick={() => navigate("/")}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                Home
              </button>
            </div>
          )}
        </div>

        {/* Toggle sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Toggle sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        {sidebarOpen && (
          <aside className="w-52 flex-shrink-0 flex flex-col border-r border-white/5"
            style={{ background: "rgba(13,17,27,0.95)" }}>
            <div className="border-b border-white/5 px-4 py-3">
              <div className="text-[10px] text-slate-600 uppercase tracking-[0.22em]">
                Participants
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2 px-1">
                Online — {userCount}
              </div>

              {/* Self */}
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: myColor }}>
                  {initials(username)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate">{username}</div>
                  <div className="text-[10px] text-slate-600">You</div>
                </div>
                <span className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              </div>

              {/* Others — from Yjs awareness */}
              {others.map((entry) => (
                <div key={entry.clientId} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: entry.color }}>
                    {initials(entry.username)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-300 truncate">{entry.username}</div>
                  </div>
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* ── CENTER — EDITOR + CONSOLE ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor — content is driven by Yjs, not React state */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              onMount={(mountedEditor) => {
                setEditor(mountedEditor);

                mountedEditor.updateOptions({
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  minimap: { enabled: true, scale: 1 },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  renderLineHighlight: "gutter",
                  padding: { top: 12 },
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                  suggest: { showWords: true },
                });

                // Size the editor to its parent explicitly. Monaco mis-measures
                // its container as ~0 when the editor mounts (via the lazy
                // route) during a frame where the flex layout hasn't resolved,
                // and freezes at 5x5. Because the container's size never
                // actually *changes* afterwards, automaticLayout's observer
                // never fires to correct it — so we lay out to the parent's real
                // size on the next frames, then keep it in sync on later resizes
                // (sidebar / console toggles).
                const parent =
                  mountedEditor.getContainerDomNode().parentElement;
                if (parent) {
                  const fit = () => {
                    const { width, height } = parent.getBoundingClientRect();
                    if (width > 0 && height > 0) {
                      mountedEditor.layout({ width, height });
                    }
                  };
                  // Fire immediately and on a few fallbacks — rAF alone can be
                  // throttled when the tab isn't actively painting.
                  fit();
                  requestAnimationFrame(fit);
                  setTimeout(fit, 0);
                  setTimeout(fit, 150);
                  const resize = new ResizeObserver(fit);
                  resize.observe(parent);
                  mountedEditor.onDidDispose(() => resize.disconnect());
                }
              }}
            />
          </div>

          {/* ── CONSOLE ── */}
          <div className={`flex-shrink-0 border-t border-white/5 transition-all duration-300 ${consoleOpen ? "h-52" : "h-9"}`}
            style={{ background: "rgba(10,14,22,0.98)" }}>
            {/* Console Header */}
            <div className="flex items-center gap-2 px-4 h-9 border-b border-white/5">
              <button
                onClick={() => setConsoleOpen(!consoleOpen)}
                className="text-slate-500 hover:text-slate-300 transition-colors mr-1"
              >
                <svg className={`w-3.5 h-3.5 transition-transform ${consoleOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {(["output", "input"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setOutputTab(tab)}
                  className={`text-xs px-3 py-1 rounded-md capitalize transition-colors ${
                    outputTab === tab ? "bg-white/8 text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab === "output" ? (
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-red-400" : "bg-green-400"}`} />
                      Output
                    </span>
                  ) : "Input (stdin)"}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                {running && (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Running…
                  </span>
                )}
                {output && (
                  <button
                    onClick={() => { setOutput(""); setIsError(false); }}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Console Body */}
            {consoleOpen && (
              <div className="h-[calc(100%-36px)] overflow-auto p-4">
                {outputTab === "output" ? (
                  output ? (
                    <pre className={`text-sm font-mono whitespace-pre-wrap leading-relaxed ${isError ? "text-red-400" : "text-green-400"}`}>
                      {output}
                    </pre>
                  ) : (
                    <div className="text-slate-600 text-sm font-mono">
                      {running ? "Running your code…" : "// Output will appear here after running"}
                    </div>
                  )
                ) : (
                  <textarea
                    id="editor-stdin"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter program input (stdin)…"
                    className="w-full h-full bg-transparent text-slate-300 text-sm font-mono resize-none outline-none placeholder-slate-700"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorRoom;
