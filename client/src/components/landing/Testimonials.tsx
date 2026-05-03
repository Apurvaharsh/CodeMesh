const testimonials = [
  {
    quote: "CodeMesh completely changed how our team does pair programming. The real-time sync is buttery smooth — it feels like you're sitting next to your teammate.",
    name: 'Priya Sharma',
    role: 'Senior Engineer @ Stripe',
    avatar: 'PS',
    color: '#3b82f6',
    stars: 5,
  },
  {
    quote: "We use CodeMesh for every technical interview now. The shared code execution feature is a game-changer. Candidates love it, interviewers love it.",
    name: 'Marcus Chen',
    role: 'Engineering Manager @ Figma',
    avatar: 'MC',
    color: '#8b5cf6',
    stars: 5,
  },
  {
    quote: "I've tried every collaborative editor out there. CodeMesh is the first one that actually feels like VS Code. The Monaco integration is perfect.",
    name: 'Sofia Rodriguez',
    role: 'Staff Engineer @ Vercel',
    avatar: 'SR',
    color: '#06b6d4',
    stars: 5,
  },
  {
    quote: "The Judge0 integration is incredible. Our bootcamp students can run Python, Java, C++ all in the same room without setting up a single thing.",
    name: 'Alex Johnson',
    role: 'Lead Instructor @ Scrimba',
    avatar: 'AJ',
    color: '#10b981',
    stars: 5,
  },
  {
    quote: "CodeMesh is insanely fast. We were impressed by how low the latency is even with 6+ people in the same room. Best tool we've added this year.",
    name: 'James Kim',
    role: 'CTO @ DevFlow',
    avatar: 'JK',
    color: '#f59e0b',
    stars: 5,
  },
  {
    quote: "The UX is stunning. It's the most beautiful code editor I've ever used. Autosave + share links mean we never lose context between sessions.",
    name: 'Aisha Patel',
    role: 'Frontend Engineer @ Linear',
    avatar: 'AP',
    color: '#ec4899',
    stars: 5,
  },
];

const StarRating = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const Testimonials = () => {
  return (
    <section id="testimonials" className="relative py-32 overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-5 text-sm text-yellow-400 border border-yellow-500/20">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Loved by Developers
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Trusted by teams at{' '}
            <span className="gradient-text">world-class companies</span>
          </h2>
          <p className="text-slate-400 text-lg">Join thousands of developers who build better, together.</p>
        </div>

        {/* Testimonial Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              id={`testimonial-${i + 1}`}
              className="glass-card rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group"
              style={{ background: 'rgba(15,23,42,0.6)' }}
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-5 text-5xl font-serif leading-none select-none opacity-10 text-white">"</div>

              {/* Stars */}
              <StarRating count={t.stars} />

              {/* Quote */}
              <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg"
                  style={{ backgroundColor: t.color, boxShadow: `0 4px 12px ${t.color}40` }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>

              {/* Accent glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 0% 100%, ${t.color}12, transparent 60%)` }}
              />
            </div>
          ))}
        </div>

        {/* Social Proof Bar */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
          {[
            { value: '4.9/5', label: 'Average Rating' },
            { value: '10,000+', label: 'Happy Developers' },
            { value: '500+', label: 'Teams' },
            { value: '99.9%', label: 'Uptime SLA' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
