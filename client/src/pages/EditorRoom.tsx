import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { roomApi } from "../services/api";
import { getSocket } from "../services/socket";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", icon: "🟨" },
  { value: "typescript", label: "TypeScript", icon: "🔷" },
  { value: "python", label: "Python", icon: "🐍" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "cpp", label: "C++", icon: "⚙️" },
  { value: "c", label: "C", icon: "🔵" },
];

interface ConnectedUser {
  id: string;
  username: string;
  color: string;
}

interface RemoteCursor {
  userId: string;
  line: number;
  column: number;
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

  const [code, setCode] = useState("// code here");
  const [language, setLanguage] = useState("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isError, setIsError] = useState(false);
  const [running, setRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, RemoteCursor>>({});
  const [userCount, setUserCount] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"participants" | "chat">("participants");
  const [outputTab, setOutputTab] = useState<"output" | "input">("output");
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myColor = useRef(USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]);
  const joinedRoomRef = useRef<string | null>(null);
  const latestCodeRef = useRef(code);
  const latestLanguageRef = useRef(language);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const remoteDecorationIdsRef = useRef<string[]>([]);

  const username = user?.username || localStorage.getItem("username") || "Guest";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  useEffect(() => {
    latestLanguageRef.current = language;
  }, [language]);

  // ─── Socket Setup ────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const joinRoom = () => {
      if (!socket.connected) return;

      if (joinedRoomRef.current === roomId) {
        debugRealtime("skip duplicate join", { roomId, socketId: socket.id, username });
        return;
      }

      debugRealtime("join-room", { roomId, socketId: socket.id, username });
      socket.emit("join-room", { roomId, username });
      joinedRoomRef.current = roomId;
    };

    // ── Handlers (defined BEFORE join so no events are missed) ──
    const handleReceiveCode = (incoming: string) => {
      debugRealtime("receive-code", { roomId, length: incoming.length });
      setCode(incoming);
    };
    const handleReceiveLanguage = (lang: string) => {
      debugRealtime("receive-language", { roomId, language: lang });
      setLanguage(lang);
    };
    const handleReceiveOutput = (out: string) => { setOutput(out); setIsError(false); };
    const handleUserCount = (count: number) => setUserCount(count);
    const handleUserList = (users: { id: string; username: string }[]) => {
      debugRealtime("user-list", { roomId, users });
      const activeUserIds = new Set(users.map((u) => u.id));
      setRemoteCursors((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([userId]) => activeUserIds.has(userId))
        )
      );
      setConnectedUsers(
        users.map((u, i) => ({ ...u, color: USER_COLORS[i % USER_COLORS.length] }))
      );
    };
    const handleRoomNotice = (msg: string) => showToast(msg);
    const handleCurrentState = ({ code: c, language: l }: any) => {
      debugRealtime("receive-current-state", { roomId, length: c.length, language: l });
      setCode(c);
      setLanguage(l);
    };
    const handleReceiveCursor = ({
      userId,
      line,
      column,
    }: {
      userId: string;
      line: number;
      column: number;
    }) => {
      debugRealtime("receive-cursor", { roomId, userId, line, column });
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { userId, line, column },
      }));
    };
    const handleConnect = () => {
      setReconnecting(false);
      joinedRoomRef.current = null;
      debugRealtime("socket connected", { roomId, socketId: socket.id });
      joinRoom();
    };
    const handleDisconnect = (reason: string) => {
      debugRealtime("socket disconnected", { roomId, reason, socketId: socket.id });
      joinedRoomRef.current = null;
      setRemoteCursors({});
      setReconnecting(true);
    };

    // ── Register listeners FIRST ─────────────────────────────────
    socket.on("receive-code", handleReceiveCode);
    socket.on("receive-language", handleReceiveLanguage);
    socket.on("receive-output", handleReceiveOutput);
    socket.on("user-count", handleUserCount);
    socket.on("user-list", handleUserList);
    socket.on("room-notice", handleRoomNotice);
    socket.on("receive-current-state", handleCurrentState);
    socket.on("receive-cursor", handleReceiveCursor);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // ── Join room AFTER listeners are ready ──────────────────────
    if (socket.connected) {
      joinRoom();
    }

    return () => {
      debugRealtime("leave-room", { roomId, socketId: socket.id, username });
      socket.emit("leave-room", { roomId, username });
      if (joinedRoomRef.current === roomId) {
        joinedRoomRef.current = null;
      }
      socket.off("receive-code", handleReceiveCode);
      socket.off("receive-language", handleReceiveLanguage);
      socket.off("receive-output", handleReceiveOutput);
      socket.off("user-count", handleUserCount);
      socket.off("user-list", handleUserList);
      socket.off("room-notice", handleRoomNotice);
      socket.off("receive-current-state", handleCurrentState);
      socket.off("receive-cursor", handleReceiveCursor);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [roomId, username]);

  // Handle request-current-state separately so it always has the latest code/language
  useEffect(() => {
    if (!roomId) return;

    const handleRequestState = (newUserId: string) => {
      debugRealtime("send-current-state", {
        roomId,
        targetId: newUserId,
        length: latestCodeRef.current.length,
        language: latestLanguageRef.current,
      });
      socket.emit("send-current-state", {
        targetId: newUserId,
        code: latestCodeRef.current,
        language: latestLanguageRef.current,
      });
    };

    socket.on("request-current-state", handleRequestState);

    return () => {
      socket.off("request-current-state", handleRequestState);
    };
  }, [roomId, socket]);

  // Load room from backend on mount
  useEffect(() => {
    if (!roomId) return;
    roomApi.get(roomId).then((res) => {
      if (res.data) {
        setCode(res.data.code);
        setLanguage(res.data.language);
      }
    }).catch(() => {});

    // Track in recent rooms
    const stored = localStorage.getItem("codemesh_recent_rooms");
    let rooms = [];
    try { rooms = stored ? JSON.parse(stored) : []; } catch { rooms = []; }
    const updated = [
      { room_id: roomId, language, updated_at: new Date().toISOString() },
      ...rooms.filter((r: any) => r.room_id !== roomId),
    ].slice(0, 10);
    localStorage.setItem("codemesh_recent_rooms", JSON.stringify(updated));
  }, [roomId]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    const connectedUserMap = new Map(
      connectedUsers.map((participant) => [participant.id, participant])
    );

    const decorations = Object.values(remoteCursors).flatMap((cursor) => {
      const participant = connectedUserMap.get(cursor.userId);

      if (!participant || cursor.userId === socket.id) {
        return [];
      }

      const colorIndex = Math.max(USER_COLORS.indexOf(participant.color), 0);
      const safeLine = Math.min(
        Math.max(cursor.line, 1),
        model.getLineCount()
      );
      const safeColumn = Math.min(
        Math.max(cursor.column, 1),
        model.getLineMaxColumn(safeLine)
      );

      return [
        {
          range: new monaco.Range(safeLine, 1, safeLine, 1),
          options: {
            isWholeLine: true,
            className: `cm-remote-cursor-line cm-remote-cursor-line-${colorIndex}`,
            linesDecorationsClassName: `cm-remote-cursor-glyph cm-remote-cursor-glyph-${colorIndex}`,
            hoverMessage: {
              value: `${participant.username} is active here`,
            },
          },
        },
        {
          range: new monaco.Range(safeLine, safeColumn, safeLine, safeColumn),
          options: {
            afterContentClassName: `cm-remote-cursor-caret cm-remote-cursor-caret-${colorIndex}`,
            hoverMessage: {
              value: `${participant.username} is active here`,
            },
          },
        },
      ];
    });

    remoteDecorationIdsRef.current = editor.deltaDecorations(
      remoteDecorationIdsRef.current,
      decorations
    );
  }, [connectedUsers, remoteCursors, code, socket.id]);

  // Autosave
  useEffect(() => {
    if (!roomId) return;
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await roomApi.save(roomId, code, language);
        setSaveStatus("saved");
        // Update recent rooms language
        const stored = localStorage.getItem("codemesh_recent_rooms");
        if (stored) {
          const rooms = JSON.parse(stored).map((r: any) =>
            r.room_id === roomId ? { ...r, language, updated_at: new Date().toISOString() } : r
          );
          localStorage.setItem("codemesh_recent_rooms", JSON.stringify(rooms));
        }
      } catch { setSaveStatus("unsaved"); }
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [code, language, roomId]);

  const handleCodeChange = useCallback((val: string) => {
    setCode(val);
    debugRealtime("code-change", { roomId, length: val.length });
    socket.emit("code-change", { roomId, code: val });
  }, [roomId, socket]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    debugRealtime("language-change", { roomId, language: lang });
    socket.emit("language-change", { roomId, language: lang });
  };

  const runCode = async () => {
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

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      user: username,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const langInfo = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];

  // Save status indicator
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
            style={{ background: myColor.current }}
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
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {(["participants", "chat"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                    sidebarTab === tab
                      ? "text-white border-b-2 border-blue-500"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Participants Tab */}
            {sidebarTab === "participants" && (
              <div className="flex-1 overflow-y-auto p-3">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2 px-1">
                  Online — {userCount}
                </div>
                {/* Self */}
                <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: myColor.current }}>
                    {initials(username)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{username}</div>
                    <div className="text-[10px] text-slate-600">You</div>
                  </div>
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                </div>

                {/* Others — real names from user-list event */}
                {connectedUsers
                  .filter(u => u.username !== username)
                  .map((u) => (
                    <div key={u.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: u.color }}>
                        {initials(u.username)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-300 truncate">{u.username}</div>
                        {remoteCursors[u.id] && (
                          <div className="text-[10px] text-slate-500">
                            Line {remoteCursors[u.id].line}
                          </div>
                        )}
                      </div>
                      <span className="ml-auto w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                    </div>
                  ))}
              </div>
            )}

            {/* Chat Tab */}
            {sidebarTab === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 text-xs">No messages yet</div>
                  ) : (
                    chatMessages.map((m, i) => (
                      <div key={i} className={`text-xs ${m.user === username ? "text-right" : ""}`}>
                        <div className="text-[10px] text-slate-600 mb-0.5">{m.user} · {m.time}</div>
                        <span className={`inline-block px-2.5 py-1.5 rounded-xl text-xs ${
                          m.user === username
                            ? "bg-blue-500/20 text-blue-200"
                            : "bg-white/5 text-slate-300"
                        }`}>{m.text}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-white/5 flex gap-1.5">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="Message…"
                    className="flex-1 text-xs rounded-lg px-3 py-2 text-white placeholder-slate-700 outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <button onClick={sendChat} className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ── CENTER — EDITOR + CONSOLE ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(val) => handleCodeChange(val || "")}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;

                // Cursor change → broadcast
                editor.onDidChangeCursorPosition((e) => {
                  socket.emit("cursor-change", {
                    roomId,
                    line: e.position.lineNumber,
                    column: e.position.column,
                  });
                });

                // Premium editor options
                editor.updateOptions({
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
              }}
              options={{
                automaticLayout: true,
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
