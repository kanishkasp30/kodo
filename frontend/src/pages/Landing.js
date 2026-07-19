import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const KodoLogo = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <line x1="20" y1="14" x2="20" y2="66" stroke="#F5F0E8" strokeWidth="7" strokeLinecap="round"/>
    <line x1="20" y1="40" x2="52" y2="14" stroke="#E8572A" strokeWidth="7" strokeLinecap="round"/>
    <line x1="20" y1="40" x2="52" y2="66" stroke="#E8572A" strokeWidth="7" strokeLinecap="round"/>
    <circle cx="58" cy="14" r="9" fill="#0D9E8A"/>
    <circle cx="58" cy="14" r="4" fill="#1C1917"/>
    <circle cx="58" cy="14" r="1.5" fill="#0D9E8A"/>
  </svg>
);

const features = [
  {
    icon: '📋',
    title: 'Real-time Kanban board',
    desc: 'Drag tasks across columns. Every team member sees updates instantly — no refresh, no lag, no confusion about who is doing what.',
    color: '#E8572A',
    bg: 'rgba(232,87,42,0.1)',
  },
  {
    icon: '✦',
    title: 'AI project assistant',
    desc: 'Ask Kōdo AI to generate your standup, identify blockers, summarise project progress, or break a feature into tasks automatically.',
    color: '#6C5CE7',
    bg: 'rgba(108,92,231,0.1)',
  },
  {
    icon: '💻',
    title: 'Code snippet library',
    desc: 'Save reusable code your whole team can find in seconds. Tagged, searchable, syntax-highlighted. No more copy-pasting from Slack.',
    color: '#0D9E8A',
    bg: 'rgba(13,158,138,0.1)',
  },
  {
    icon: '📄',
    title: 'Documentation wiki',
    desc: 'Write your architecture notes, API references, and decisions in a wiki that lives next to your tasks and code. Always up to date.',
    color: '#F0A500',
    bg: 'rgba(240,165,0,0.1)',
  },
  {
    icon: '🔍',
    title: 'AI code reviewer',
    desc: 'Paste any code and get a quality score, bug reports, and performance suggestions instantly. Supports JS, Python, Java, C++, and Go.',
    color: '#E8572A',
    bg: 'rgba(232,87,42,0.1)',
  },
  {
    icon: '⚡',
    title: 'Live activity feed',
    desc: 'See everything happening across your workspace in real time. Who moved what, who added what, timestamped to the second.',
    color: '#0D9E8A',
    bg: 'rgba(13,158,138,0.1)',
  },
];

const steps = [
  { num: '01', title: 'Create your workspace', desc: 'Sign up and name your workspace. Takes 30 seconds.' },
  { num: '02', title: 'Invite your team', desc: 'Share an invite code. Teammates join instantly.' },
  { num: '03', title: 'Create a project', desc: 'Name your project and let AI generate your first tasks.' },
  { num: '04', title: 'Build together', desc: 'Real-time board, AI assistant, snippets, wiki — all ready.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#1C1917', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#F5F0E8' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;1,600&family=Playfair+Display:ital,wght@1,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .nav-link { color: rgba(245,240,232,0.6); text-decoration: none; font-size: 14px; transition: color 0.15s; cursor: pointer; }
        .nav-link:hover { color: #F5F0E8; }
        .feature-card { transition: all 0.2s ease; cursor: pointer; }
        .feature-card:hover { transform: translateY(-2px); }
        .btn-primary { background: #E8572A; color: #fff; border: none; border-radius: 10px; padding: 13px 28px; font-family: 'Playfair Display', serif; font-style: italic; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .btn-primary:hover { background: #c94a22; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: #F5F0E8; border: 1px solid rgba(245,240,232,0.25); border-radius: 10px; padding: 13px 28px; font-family: 'Playfair Display', serif; font-style: italic; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .btn-ghost:hover { border-color: rgba(245,240,232,0.5); background: rgba(245,240,232,0.05); }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(28,25,23,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '0.5px solid rgba(245,240,232,0.08)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <KodoLogo size={32} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', fontWeight: 600, color: '#F5F0E8' }}>Kōdo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span className="nav-link" onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}>About</span>
          <span className="nav-link" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>Features</span>
          <span className="nav-link" onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}>How It Works</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={() => navigate('/login')}>Sign in</button>
          <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={() => navigate('/register')}>Get started free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 40px 80px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(232,87,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,87,42,0.04) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'rgba(232,87,42,0.06)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '400px', height: '400px', background: 'rgba(108,92,231,0.06)', borderRadius: '50%', filter: 'blur(100px)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(108,92,231,0.15)', border: '0.5px solid rgba(108,92,231,0.3)', borderRadius: '20px', padding: '6px 14px', marginBottom: '28px' }}>
            <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6C5CE7', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: '#A99CF8', fontWeight: 600 }}>Built for student developer teams</span>
          </div>

          <div className="float" style={{ marginBottom: '24px' }}>
            <KodoLogo size={80} />
          </div>

          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '64px', fontWeight: 700, color: '#F5F0E8', lineHeight: 1.05, marginBottom: '20px', letterSpacing: '-1.5px' }}>
            The developer's<br />
            <span style={{ color: '#E8572A' }}>way.</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'rgba(245,240,232,0.6)', lineHeight: 1.7, marginBottom: '36px', maxWidth: '560px', margin: '0 auto 36px' }}>
            Tasks, code, docs, and AI — one workspace your team never wants to close. Built specifically for students and developer teams who are tired of switching between 5 different apps.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
            <button className="btn-primary" onClick={() => navigate('/register')}>Start for free</button>
            <button className="btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          </div>

          <div style={{ fontSize: '12px', color: 'rgba(245,240,232,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
            Free forever for small teams. No credit card required.
          </div>
        </div>
      </section>

      {/* WHAT IS KODO */}
      <section id="about" style={{ padding: '80px 40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 700, color: '#F5F0E8', marginBottom: '16px' }}>
            What is Kōdo?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(245,240,232,0.55)', lineHeight: 1.8, maxWidth: '620px', margin: '0 auto' }}>
            Kōdo is a real-time collaborative workspace designed for student developers and small dev teams. Think of it as five tools combined into one — so your team stops jumping between apps and starts actually building.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '48px' }}>
          {[
            { from: 'Trello / Jira', to: 'Kanban board', desc: 'Real-time task tracking', color: '#E8572A' },
            { from: 'Notion', to: 'Wiki', desc: 'Docs next to your code', color: '#F0A500' },
            { from: 'GitHub Gists', to: 'Snippets', desc: 'Team code library', color: '#0D9E8A' },
            { from: 'ChatGPT', to: 'Kōdo AI', desc: 'Reads your actual board', color: '#6C5CE7' },
            { from: 'Slack', to: 'Activity feed', desc: 'Everything in one place', color: '#9B7FA6' },
            { from: 'Code review tools', to: 'AI reviewer', desc: 'Score + line feedback', color: '#E8572A' },
          ].map((item) => (
            <div key={item.from} style={{ background: 'rgba(245,240,232,0.04)', border: '0.5px solid rgba(245,240,232,0.08)', borderRadius: '14px', padding: '16px 18px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(245,240,232,0.35)', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>{item.from}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: item.color, marginBottom: '4px' }}>→ {item.to}</div>
              <div style={{ fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 700, color: '#F5F0E8', marginBottom: '12px' }}>
            Everything your team needs
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.7 }}>
            Six powerful features. One workspace. Zero switching.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="feature-card"
              onClick={() => setActiveFeature(i)}
              style={{
                background: activeFeature === i ? 'rgba(245,240,232,0.07)' : 'rgba(245,240,232,0.03)',
                border: `0.5px solid ${activeFeature === i ? f.color + '40' : 'rgba(245,240,232,0.07)'}`,
                borderRadius: '16px', padding: '20px',
                borderLeft: activeFeature === i ? `3px solid ${f.color}` : '3px solid transparent',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>
                {f.icon}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#F5F0E8', marginBottom: '6px' }}>{f.title}</div>
              <div style={{ fontSize: '12px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: '80px 40px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 700, color: '#F5F0E8', marginBottom: '12px' }}>
            Up in 60 seconds
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(245,240,232,0.5)' }}>
            No setup headaches. No lengthy onboarding. Just build.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {steps.map((step, i) => (
            <div key={step.num} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', paddingBottom: i < steps.length - 1 ? '0' : '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E8572A', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: '1px', height: '48px', background: 'rgba(232,87,42,0.2)', margin: '8px 0' }} />
                )}
              </div>
              <div style={{ paddingTop: '10px', paddingBottom: '24px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#F5F0E8', marginBottom: '4px' }}>{step.title}</div>
                <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section style={{ padding: '80px 40px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '40px', fontWeight: 700, color: '#F5F0E8', marginBottom: '12px' }}>
            Built for you
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {[
            { title: 'Hackathon teams', icon: '⚡', desc: 'Ship faster with a real-time board, AI task generator, and instant standup reports. Built for 24-hour sprints.', color: '#E8572A' },
            { title: 'College project groups', icon: '🎓', desc: 'Replace the WhatsApp group + Google Sheet combo. One place for tasks, code, and docs your professor can also view.', color: '#6C5CE7' },
            { title: 'Developer duos', icon: '💻', desc: 'Two devs, one project. Real-time board so neither of you steps on each other. AI reviews your code before you push.', color: '#0D9E8A' },
          ].map((item) => (
            <div key={item.title} style={{ background: 'rgba(245,240,232,0.04)', border: '0.5px solid rgba(245,240,232,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{item.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: item.color, marginBottom: '8px' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(232,87,42,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '48px', fontWeight: 700, color: '#F5F0E8', marginBottom: '16px', letterSpacing: '-1px' }}>
            Ready to build?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(245,240,232,0.5)', marginBottom: '32px' }}>
            Join your team on Kōdo. Free forever for small teams.
          </p>
          <button className="btn-primary" style={{ fontSize: '16px', padding: '14px 36px' }} onClick={() => navigate('/register')}>
            Create your workspace free
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '0.5px solid rgba(245,240,232,0.08)', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KodoLogo size={24} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', color: '#F5F0E8' }}>Kōdo</span>
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '14px', color: 'rgba(245,240,232,0.3)' }}>
          Built for builders.
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(245,240,232,0.3)' }}>
          The developer's way.
        </div>
      </footer>

    </div>
  );
}


