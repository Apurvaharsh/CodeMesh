import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GITHUB_URL = 'https://github.com/Apurvaharsh/CodeMesh';

interface RecentRoom {
  room_id: string;
  language: string;
  updated_at: string;
}

const CTABanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 9);
    const stored = localStorage.getItem('codemesh_recent_rooms');

    let rooms: RecentRoom[] = [];
    try {
      rooms = stored ? JSON.parse(stored) : [];
    } catch {
      rooms = [];
    }

    const updated = [
      { room_id: id, language: 'javascript', updated_at: new Date().toISOString() },
      ...rooms.filter((room) => room.room_id !== id),
    ].slice(0, 10);

    localStorage.setItem('codemesh_recent_rooms', JSON.stringify(updated));
    navigate(`/room/${id}`);
  };

  return (
    <section id="cta" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(59,130,246,0.4), transparent)' }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-purple-400 border border-purple-500/20">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          Free to get started - No credit card required
        </div>

        <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 leading-tight">
          Start your first coding room
          <br />
          <span className="gradient-text">in seconds.</span>
        </h2>

        <p className="text-slate-400 text-lg lg:text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
          No setup. No installs. Just open CodeMesh, create a room, and start building with your team right now.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-10">
          {user ? (
            <button
              id="cta-get-started"
              onClick={createRoom}
              className="btn-primary text-lg px-10 py-4 flex items-center gap-2.5 shadow-xl shadow-purple-500/20"
            >
              <span>🚀</span>
              <span>Create Room</span>
            </button>
          ) : (
            <Link
              to="/signup"
              id="cta-get-started"
              className="btn-primary text-lg px-10 py-4 flex items-center gap-2.5 shadow-xl shadow-purple-500/20"
            >
              <span>🚀</span>
              <span>Create Your Free Room</span>
            </Link>
          )}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="cta-github"
            className="btn-ghost text-base px-8 py-4 flex items-center gap-2.5"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            <span>View on GitHub</span>
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          {[
            '✓ Free forever plan',
            '✓ No credit card needed',
            '✓ 99.9% uptime SLA',
            '✓ Open source',
          ].map((item) => (
            <span key={item} className="flex items-center gap-1 text-slate-400">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
