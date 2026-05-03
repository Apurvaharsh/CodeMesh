import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GITHUB_URL = 'https://github.com/Apurvaharsh/CodeMesh';

interface RecentRoom {
  room_id: string;
  language: string;
  updated_at: string;
}

const languageIcons: Record<string, string> = {
  javascript: "🟨",
  typescript: "🔷",
  python: "🐍",
  java: "☕",
  cpp: "⚙️",
  c: "🔵",
};

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;

    const stored = localStorage.getItem("codemesh_recent_rooms");
    if (!stored) {
      setRecentRooms([]);
      return;
    }

    try {
      setRecentRooms(JSON.parse(stored));
    } catch {
      setRecentRooms([]);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const initials = user?.username
    ? user.username.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'GitHub', href: GITHUB_URL, target: '_blank' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-dark shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
            <span className="relative z-10 text-white font-bold text-sm font-mono">CM</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Code<span className="gradient-text-blue">Mesh</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map(({ label, href, target }) => (
            <a
              key={label}
              href={href}
              target={target}
              rel={target === '_blank' ? 'noopener noreferrer' : undefined}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 relative group"
            >
              {label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                  }}
                  className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                    {initials}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                      {user.username}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {recentRooms.length} recent room{recentRooms.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 glass-dark rounded-2xl border border-white/8 shadow-xl shadow-black/40 p-4 z-50">
                    <div className="pb-3 border-b border-white/5">
                      <div className="text-sm font-medium text-white truncate">{user.username}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    </div>

                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recent Rooms</div>
                        {recentRooms.length > 0 && (
                          <button
                            onClick={() => {
                              setRecentRooms([]);
                              localStorage.removeItem('codemesh_recent_rooms');
                            }}
                            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {recentRooms.length === 0 ? (
                          <div className="rounded-xl border border-white/5 bg-white/3 px-3 py-4 text-xs text-slate-500">
                            No room history yet.
                          </div>
                        ) : (
                          recentRooms.slice(0, 5).map((room) => (
                            <button
                              key={room.room_id}
                              onClick={() => {
                                setProfileOpen(false);
                                navigate(`/room/${room.room_id}`);
                              }}
                              className="w-full rounded-xl border border-white/5 bg-white/3 px-3 py-2.5 text-left hover:bg-white/6 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{languageIcons[room.language] || '💻'}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-mono text-white truncate">{room.room_id}</div>
                                  <div className="text-[11px] text-slate-500 capitalize">{room.language}</div>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/15 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-1.5"
              >
                <span>Create Free Account</span>
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-slate-300 hover:text-white transition-colors p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="glass-dark border-t border-white/5 px-6 py-5 flex flex-col gap-4">
          {navLinks.map(({ label, href, target }) => (
            <a
              key={label}
              href={href}
              target={target}
              rel={target === '_blank' ? 'noopener noreferrer' : undefined}
              onClick={() => setMobileOpen(false)}
              className="text-slate-400 hover:text-white text-sm font-medium py-1 transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
            {user ? (
              <>
                <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
                  <div className="text-sm font-medium text-white">{user.username}</div>
                  <div className="text-xs text-slate-500 mb-3">{user.email}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">Recent Rooms</div>
                  <div className="space-y-2">
                    {recentRooms.length === 0 ? (
                      <div className="text-xs text-slate-500">No room history yet.</div>
                    ) : (
                      recentRooms.slice(0, 3).map((room) => (
                        <button
                          key={room.room_id}
                          onClick={() => {
                            setMobileOpen(false);
                            navigate(`/room/${room.room_id}`);
                          }}
                          className="w-full rounded-xl border border-white/5 bg-white/3 px-3 py-2 text-left"
                        >
                          <div className="text-sm font-mono text-white truncate">{room.room_id}</div>
                          <div className="text-[11px] text-slate-500 capitalize">{room.language}</div>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-slate-300 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white/5 text-center flex-1">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="btn-primary text-sm px-5 py-2.5 flex-1 text-center">
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
