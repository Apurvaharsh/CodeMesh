import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GITHUB_URL = 'https://github.com/Apurvaharsh/CodeMesh';

interface RecentRoom {
  room_id: string;
  language: string;
  updated_at: string;
}

const CodeEditorMockup = () => {
  return (
    <div className="relative animate-float">
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl blur-3xl" />
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl" />

      <div
        className="relative rounded-2xl overflow-hidden animate-pulse-glow border border-white/10 shadow-2xl shadow-black/50"
        style={{ background: 'rgba(13,17,30,0.95)' }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3.5 border-b border-white/5"
          style={{ background: 'rgba(30,38,60,0.9)' }}
        >
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-400 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80 hover:bg-yellow-400 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-green-400/80 hover:bg-green-400 transition-colors cursor-pointer" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="glass rounded-md px-6 py-1 text-xs text-slate-400 font-mono flex items-center gap-2">
              <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              main.ts - CodeMesh
            </div>
          </div>
          <div className="flex items-center -space-x-1.5">
            {[
              { initials: 'AK', color: '#3b82f6', name: 'Alex' },
              { initials: 'SR', color: '#a855f7', name: 'Sarah' },
              { initials: 'JD', color: '#06b6d4', name: 'James' },
            ].map((u) => (
              <div
                key={u.initials}
                title={u.name}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:scale-110 transition-transform hover:z-10 relative"
                style={{ backgroundColor: u.color, borderColor: 'rgba(15,23,42,0.8)' }}
              >
                {u.initials}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 ml-1">
              +2
            </div>
          </div>
        </div>

        <div className="flex border-b border-white/5" style={{ background: 'rgba(20,28,48,0.9)' }}>
          {['main.ts', 'utils.ts', 'types.d.ts'].map((tab, i) => (
            <div
              key={tab}
              className={`px-4 py-2 text-xs font-mono cursor-pointer transition-colors border-r border-white/5 ${
                i === 0
                  ? 'text-white border-b-2 border-b-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        <div
          className="p-4 font-mono text-[11px] leading-6 relative overflow-hidden select-none"
          style={{ background: 'rgba(13,17,30,0.98)', minHeight: '240px' }}
        >
          <div
            className="absolute left-10 right-4 h-5 rounded"
            style={{ top: '80px', background: 'rgba(59,130,246,0.1)' }}
          />
          <div
            className="absolute left-10 right-4 h-5 rounded"
            style={{ top: '176px', background: 'rgba(168,85,247,0.1)' }}
          />

          {[
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">1</span>
              <span className="text-violet-400">const</span>
              <span className="text-slate-300"> room </span>
              <span className="text-slate-400">=</span>
              <span className="text-yellow-300"> createRoom</span>
              <span className="text-slate-300">{'({'}</span>
            </>,
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">2</span>
              <span className="text-slate-300 pl-8"> </span>
              <span className="text-sky-300">id</span>
              <span className="text-slate-400">: </span>
              <span className="text-yellow-300">generateId</span>
              <span className="text-slate-300">(),</span>
            </>,
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">3</span>
              <span className="text-slate-300 pl-8"> </span>
              <span className="text-sky-300">users</span>
              <span className="text-slate-400">: [</span>
              <span className="text-green-300">'Alex'</span>
              <span className="text-slate-400">, </span>
              <span className="text-green-300">'Sarah'</span>
              <span className="text-slate-400">],</span>
              <span className="inline-block w-0.5 h-[14px] bg-blue-400 ml-0.5 align-middle animate-cursor-blink" />
            </>,
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">4</span>
              <span className="text-slate-300 pl-8"> </span>
              <span className="text-sky-300">realtime</span>
              <span className="text-slate-400">: </span>
              <span className="text-orange-400">true</span>
            </>,
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">5</span>
              <span className="text-slate-300">{'});'}</span>
            </>,
            <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">6</span>,
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">7</span>
              <span className="text-slate-500 italic">{'// Run code in 50+ languages'}</span>
            </>,
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">8</span>
              <span className="text-violet-400">await</span>
              <span className="text-slate-300"> room.</span>
              <span className="text-yellow-300">execute</span>
              <span className="text-slate-300">{'({'}</span>
            </>,
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">9</span>
              <span className="text-slate-300 pl-8"> </span>
              <span className="text-sky-300">lang</span>
              <span className="text-slate-400">: </span>
              <span className="text-green-300">'javascript'</span>
              <span className="text-slate-400">,</span>
              <span
                className="inline-block w-0.5 h-[14px] bg-purple-400 ml-0.5 align-middle animate-cursor-blink"
                style={{ animationDelay: '0.5s' }}
              />
            </>,
            <>
              <span className="text-slate-600 select-none w-7 inline-block text-right pr-3">10</span>
              <span className="text-slate-300">{'});'}</span>
            </>,
          ].map((line, i) => (
            <div key={i} className="relative flex items-center min-h-[24px]">
              {line}
            </div>
          ))}

          <div className="absolute" style={{ top: '68px', left: '72px' }}>
            <div className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold shadow-lg">
              Alex
            </div>
          </div>
          <div className="absolute" style={{ top: '212px', left: '100px' }}>
            <div className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold shadow-lg">
              Sarah
            </div>
          </div>
        </div>

        <div
          className="px-4 py-2 flex items-center gap-4 text-[10px] border-t border-white/5"
          style={{ background: 'rgba(88,28,220,0.3)' }}
        >
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            3 collaborators live
          </span>
          <span className="text-slate-500">TypeScript</span>
          <span className="text-slate-500">UTF-8</span>
          <span className="ml-auto text-slate-500">Ln 3, Col 28 - Autosaved</span>
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinId, setJoinId] = useState('');

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

  const joinRoom = () => {
    const roomId = joinId.trim();
    if (!roomId) return;

    setJoinOpen(false);
    navigate(`/room/${roomId}`);
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.1) 0%, transparent 70%)' }}
        />
      </div>

      <div
        className="absolute top-1/3 left-1/5 w-[500px] h-[500px] rounded-full pointer-events-none animate-float-slow"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] rounded-full pointer-events-none animate-float"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', filter: 'blur(60px)', animationDelay: '3s' }}
      />
      <div
        className="absolute top-2/3 left-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center w-full">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-slate-300 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span>Now in public beta</span>
            <span className="text-slate-600">-</span>
            <span className="text-blue-400 font-medium">Join 10,000+ developers</span>
            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.08] tracking-tight mb-6">
            <span className="text-white">Code Together.</span>
            <br />
            <span className="gradient-text animate-gradient">Build Faster.</span>
          </h1>

          <p className="text-slate-400 text-lg lg:text-xl leading-relaxed mb-10 max-w-xl">
            Real-time collaborative coding with{' '}
            <span className="text-slate-200">live sync</span>,{' '}
            <span className="text-slate-200">multiplayer rooms</span>,{' '}
            <span className="text-slate-200">instant execution</span>, and a beautiful developer experience.
          </p>

          <div className="flex flex-wrap gap-4 mb-8">
            {user ? (
              <>
                <button
                  id="hero-create-room"
                  onClick={createRoom}
                  className="btn-primary text-base px-8 py-4 flex items-center gap-2"
                >
                  <span>*</span>
                  <span>Create Room</span>
                </button>
                <button
                  id="hero-join-room"
                  onClick={() => setJoinOpen((open) => !open)}
                  className="btn-ghost text-base px-8 py-4 flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>Join Room</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  id="hero-start-coding"
                  className="btn-primary text-base px-8 py-4 flex items-center gap-2"
                >
                  <span>*</span>
                  <span>Start Coding Free</span>
                </Link>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="hero-secondary-action"
                  className="btn-ghost text-base px-8 py-4 flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <span>View on GitHub</span>
                </a>
              </>
            )}
          </div>

          {user && joinOpen && (
            <div className="glass-dark rounded-2xl border border-white/10 p-4 max-w-xl mb-14 animate-fade-in">
              <div className="text-white font-semibold mb-1">Join an existing room</div>
              <div className="text-slate-500 text-sm mb-4">Enter the room ID shared with you.</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  placeholder="Enter Room ID"
                  className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button
                  onClick={joinRoom}
                  disabled={!joinId.trim()}
                  className="btn-primary px-5 py-3 text-sm disabled:opacity-50"
                >
                  <span>Join Room</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-8">
            {[
              { value: '10K+', label: 'Developers' },
              { value: '500+', label: 'Teams' },
              { value: '50+', label: 'Languages' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-8">
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
                {i < 2 && <div className="w-px h-10 bg-white/10" />}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          <CodeEditorMockup />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(transparent, #0f172a)' }}
      />
    </section>
  );
};

export default Hero;
