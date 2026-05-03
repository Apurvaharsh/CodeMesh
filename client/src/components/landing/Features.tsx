const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Real-time Sync',
    description: 'Every keystroke synced instantly across all collaborators with sub-10ms latency using WebSocket technology.',
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'rgba(59,130,246,0.3)',
    border: 'rgba(59,130,246,0.2)',
    tag: 'Live',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Multiplayer Rooms',
    description: 'Create isolated coding environments with unique IDs. See live cursors and presence for every collaborator.',
    gradient: 'from-purple-500 to-violet-400',
    glow: 'rgba(139,92,246,0.3)',
    border: 'rgba(139,92,246,0.2)',
    tag: 'Live',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Judge0 Execution',
    description: 'Run code in 50+ languages powered by Judge0. Shared console output visible to every collaborator instantly.',
    gradient: 'from-pink-500 to-rose-400',
    glow: 'rgba(236,72,153,0.3)',
    border: 'rgba(236,72,153,0.2)',
    tag: 'New',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Google Auth',
    description: 'Secure sign-in with Google OAuth 2.0. Your identity, sessions, and rooms are safely protected.',
    gradient: 'from-orange-500 to-amber-400',
    glow: 'rgba(249,115,22,0.3)',
    border: 'rgba(249,115,22,0.2)',
    tag: null,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    ),
    title: 'Autosave',
    description: 'Never lose a line of code. Every change is persisted to the cloud automatically with debounced writes.',
    gradient: 'from-emerald-500 to-teal-400',
    glow: 'rgba(16,185,129,0.3)',
    border: 'rgba(16,185,129,0.2)',
    tag: null,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    title: 'Share Links',
    description: 'Generate a public room link and onboard teammates instantly — no account or setup required to join.',
    gradient: 'from-indigo-500 to-blue-400',
    glow: 'rgba(99,102,241,0.3)',
    border: 'rgba(99,102,241,0.2)',
    tag: null,
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* BG accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent to-blue-500/30" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-5 text-sm text-blue-400 border border-blue-500/20">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Powerful Features
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5">
            Everything you need to{' '}
            <span className="gradient-text">collaborate</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Built for modern development teams who value speed, reliability, and a beautiful developer experience that gets out of your way.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              id={`feature-${f.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="glass-card rounded-2xl p-6 group relative overflow-hidden"
              style={{
                background: 'rgba(15,23,42,0.6)',
                borderColor: f.border,
              }}
            >
              {/* Subtle corner glow on hover */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${f.glow}, transparent 70%)` }}
              />

              {/* Tag */}
              {f.tag && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: f.tag === 'New' ? 'rgba(168,85,247,0.2)' : 'rgba(34,197,94,0.2)',
                    color: f.tag === 'New' ? '#c084fc' : '#4ade80',
                    border: `1px solid ${f.tag === 'New' ? 'rgba(168,85,247,0.3)' : 'rgba(34,197,94,0.3)'}`,
                  }}>
                  {f.tag}
                </span>
              )}

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                style={{ boxShadow: `0 8px 24px ${f.glow}` }}
              >
                {f.icon}
              </div>

              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${f.glow}, transparent)` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
