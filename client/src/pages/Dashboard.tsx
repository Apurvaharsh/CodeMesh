import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RecentRoom {
  room_id: string;
  language: string;
  updated_at: string;
}

// Skeleton loader for recent rooms
const RoomSkeleton = () => (
  <div className="glass rounded-xl p-4 animate-pulse border border-white/5">
    <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
    <div className="h-3 bg-white/6 rounded w-1/4" />
  </div>
);

const languageIcons: Record<string, string> = {
  javascript: "🟨",
  typescript: "🔷",
  python: "🐍",
  java: "☕",
  cpp: "⚙️",
  c: "🔵",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [joinId, setJoinId] = useState("");
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Load recent rooms from localStorage (no dedicated "list rooms" endpoint)
  useEffect(() => {
    const stored = localStorage.getItem("codemesh_recent_rooms");
    if (stored) {
      try {
        setRecentRooms(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setLoadingRooms(false);
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const createRoom = async () => {
    setCreating(true);
    try {
      const id = Math.random().toString(36).substring(2, 9);
      // Track in recent rooms
      const newRoom: RecentRoom = {
        room_id: id,
        language: "javascript",
        updated_at: new Date().toISOString(),
      };
      const updated = [newRoom, ...recentRooms.filter(r => r.room_id !== id)].slice(0, 10);
      setRecentRooms(updated);
      localStorage.setItem("codemesh_recent_rooms", JSON.stringify(updated));
      navigate(`/room/${id}`);
    } catch {
      showToast("Could not create room. Try again.", "error");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = () => {
    const id = joinId.trim();
    if (!id) { showToast("Enter a Room ID first.", "error"); return; }
    navigate(`/room/${id}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = user?.username
    ? user.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl animate-slide-up ${
          toast.type === "success"
            ? "bg-green-500/20 border border-green-500/30 text-green-300"
            : "bg-red-500/20 border border-red-500/30 text-red-300"
        }`}>
          {toast.type === "success" ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* Navbar */}
      <header className="glass-dark border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center shadow-md shadow-blue-500/30">
              <span className="relative z-10 text-white font-bold text-xs font-mono">CM</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Code<span className="gradient-text-blue">Mesh</span>
            </span>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-3 relative">
            {/* Profile dropdown */}
            <button
              id="dashboard-profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-white leading-none">{user?.username || "User"}</div>
                <div className="text-xs text-slate-500 mt-0.5">{user?.email}</div>
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-52 glass-dark rounded-xl border border-white/8 shadow-xl shadow-black/40 py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-white/5">
                  <div className="text-sm font-medium text-white truncate">{user?.username}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                </div>
                <button
                  id="dashboard-logout"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12 relative">
        {/* Welcome */}
        <div className="mb-10">
          <p className="text-slate-400 text-sm mb-1">Good to see you back 👋</p>
          <h1 className="text-3xl font-bold text-white">
            Welcome, <span className="gradient-text">{user?.username || "Developer"}</span>
          </h1>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {/* Create Room */}
          <div className="glass rounded-2xl p-6 border border-white/7 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)" }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold">Create Room</h2>
                <p className="text-slate-500 text-xs">Start a new collaborative session</p>
              </div>
            </div>
            <button
              id="dashboard-create-room"
              onClick={createRoom}
              disabled={creating}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="relative z-10">Creating...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">⚡</span>
                  <span className="relative z-10">New Room</span>
                </>
              )}
            </button>
          </div>

          {/* Join Room */}
          <div className="glass rounded-2xl p-6 border border-white/7 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)" }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold">Join Room</h2>
                <p className="text-slate-500 text-xs">Enter an existing room ID</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                id="dashboard-join-input"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                placeholder="Enter Room ID…"
                className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-purple-500/60 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <button
                id="dashboard-join-btn"
                onClick={joinRoom}
                className="btn-primary px-4 py-3 text-sm font-semibold rounded-xl"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}
              >
                <span className="relative z-10">Join</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Rooms */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Rooms</h2>
            {recentRooms.length > 0 && (
              <button
                onClick={() => { setRecentRooms([]); localStorage.removeItem("codemesh_recent_rooms"); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear history
              </button>
            )}
          </div>

          {loadingRooms ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <RoomSkeleton key={i} />)}
            </div>
          ) : recentRooms.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center border border-white/5">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.1)" }}>
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">No rooms yet</p>
              <p className="text-slate-500 text-sm">Create or join a room to get started.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentRooms.map((room) => (
                <button
                  key={room.room_id}
                  onClick={() => navigate(`/room/${room.room_id}`)}
                  className="w-full glass-card rounded-xl px-4 py-3.5 flex items-center gap-4 text-left group border border-white/5 hover:border-blue-500/20"
                >
                  <span className="text-2xl">{languageIcons[room.language] || "💻"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-mono text-sm font-medium truncate">{room.room_id}</div>
                    <div className="text-slate-500 text-xs capitalize mt-0.5">{room.language}</div>
                  </div>
                  <div className="text-slate-600 text-xs hidden sm:block">
                    {new Date(room.updated_at).toLocaleDateString()}
                  </div>
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {[
            { label: "Rooms Created", value: recentRooms.length, icon: "🏠" },
            { label: "Languages", value: new Set(recentRooms.map(r => r.language)).size || 0, icon: "⚡" },
            { label: "Active Today", value: recentRooms.filter(r => new Date(r.updated_at).toDateString() === new Date().toDateString()).length, icon: "🔥" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center border border-white/5">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
