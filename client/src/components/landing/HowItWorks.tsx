const steps = [
  {
    number: '01',
    title: 'Create a Room',
    description: 'Click "New Room" to instantly spin up a collaborative workspace. A unique shareable URL is generated in milliseconds.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'rgba(59,130,246,0.4)',
    detail: 'Auto-generates a unique room ID',
  },
  {
    number: '02',
    title: 'Invite Your Team',
    description: 'Share the room link with teammates. They join instantly with no setup, no install, and no friction whatsoever.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-violet-400',
    glow: 'rgba(139,92,246,0.4)',
    detail: 'No account required to join',
  },
  {
    number: '03',
    title: 'Code Live Together',
    description: 'Edit simultaneously, watch cursors move in real-time, run code, and ship something great as a team.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    gradient: 'from-pink-500 to-rose-400',
    glow: 'rgba(236,72,153,0.4)',
    detail: 'Live cursors & shared output',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-5 text-sm text-purple-400 border border-purple-500/20">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How It Works
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5">
            Up and running in{' '}
            <span className="gradient-text">30 seconds</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No config. No installs. Just pure collaborative coding from the moment you open CodeMesh.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid lg:grid-cols-3 gap-8">
          {/* Connector Line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-1/6 right-1/6 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.5), rgba(168,85,247,0.5), rgba(236,72,153,0.5))' }} />

          {steps.map((step, i) => (
            <div
              key={i}
              id={`step-${i + 1}`}
              className="relative group text-center"
            >
              {/* Step Number Bubble */}
              <div className="relative inline-block mb-6">
                {/* Outer ring */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${step.glow}, rgba(0,0,0,0))`, boxShadow: `0 0 0 1px ${step.glow}` }}
                >
                  <div
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-xl`}
                    style={{ boxShadow: `0 8px 32px ${step.glow}` }}
                  >
                    {step.icon}
                  </div>
                </div>
                {/* Step number */}
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ background: 'rgba(15,23,42,1)', border: `1px solid ${step.glow}`, color: step.gradient.includes('blue') ? '#60a5fa' : step.gradient.includes('purple') ? '#c084fc' : '#f472b6' }}>
                  {i + 1}
                </span>
              </div>

              {/* Card */}
              <div className="glass-card rounded-2xl p-6 text-left relative overflow-hidden"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {/* Large step number watermark */}
                <span
                  className="absolute top-3 right-4 text-5xl font-black opacity-5 select-none font-mono"
                  style={{ color: step.gradient.includes('blue') ? '#3b82f6' : step.gradient.includes('purple') ? '#8b5cf6' : '#ec4899' }}
                >
                  {step.number}
                </span>

                <h3 className="text-white font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{step.description}</p>

                <div className="inline-flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-1.5"
                  style={{ background: `${step.glow.replace('0.4', '0.1')}`, color: step.gradient.includes('blue') ? '#93c5fd' : step.gradient.includes('purple') ? '#c4b5fd' : '#fda4af' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {step.detail}
                </div>
              </div>

              {/* Arrow between steps (mobile) */}
              {i < steps.length - 1 && (
                <div className="lg:hidden flex justify-center my-4 text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
