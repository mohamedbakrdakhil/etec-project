import React, { useState, useEffect } from 'react';

/* ── Floating particles ── */
const Particles = () => {
  const pts = Array.from({ length: 16 }, (_, i) => ({
    id: i, size: 3 + Math.random() * 5,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    dur: 6 + Math.random() * 8,
    op: 0.07 + Math.random() * 0.11,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position: 'absolute', bottom: -20, left: `${p.left}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: 'var(--accent)', opacity: p.op,
          animation: `particleRise ${p.dur}s ease-in ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
};

/* ── Typewriter ── */
const useTypewriter = (text, speed = 35, startDelay = 700) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const t = setTimeout(() => {
      const timer = setInterval(() => {
        setDisplayed(text.slice(0, ++i));
        if (i >= text.length) clearInterval(timer);
      }, speed);
      return () => clearInterval(timer);
    }, startDelay);
    return () => clearTimeout(t);
  }, [text, speed, startDelay]);
  return displayed;
};

/* ── Brand card ── */
const BrandCard = ({ icon, value, label, color, delay }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay + 900); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '13px 15px',
      display: 'flex', alignItems: 'center', gap: 10,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(14px)',
      transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
};

const BRAND_CARDS = [
  { icon: '🏛️', value: '1985',        label: 'Année de fondation',  color: '#7C3AED' },
  { icon: '✅', value: '2005',         label: 'Accréditée depuis',   color: '#10B981' },
  { icon: '📅', value: `${new Date().getFullYear() - 1985}+`, label: "Ans d'expérience", color: '#F59E0B' },
  { icon: '📍', value: 'Fès',          label: 'Maroc',               color: '#0EA5E9' },
  { icon: '🤝', value: 'FEDE · FIEP', label: 'Partenariats',         color: '#EF4444' },
  { icon: '💡', value: 'Innovation',   label: 'Dans notre ADN',       color: '#06D6A0' },
];

const ROLE_BADGE = {
  developpeur: { label: 'Développeur', color: '#7C3AED' },
  admin:       { label: 'Administration', color: '#0EA5E9' },
  professeur:  { label: 'Professeur', color: '#F59E0B' },
  etudiant:    { label: 'Étudiant', color: '#10B981' },
};

/* ============================================================
   ETECHero — shared across all dashboards
   Props:
     user        — auth user object
     subtitle    — optional extra line below greeting
   ============================================================ */
const ETECHero = ({ user, subtitle }) => {
  const greeting = user ? `Bienvenue, ${user.prenom} ${user.nom} 👋` : '';
  const typed = useTypewriter(greeting, 35, 600);
  const role = user?.role;
  const badge = ROLE_BADGE[role] || {};

  return (
    <>
      {/* ── HERO HEADER ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(6,214,160,0.06) 0%, rgba(124,58,237,0.06) 50%, rgba(14,165,233,0.04) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 24, padding: '28px 28px 24px',
        marginBottom: 24, overflow: 'hidden',
        animation: 'cardEntrance 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <Particles />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            {/* Left: logo + greeting */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent), #7C3AED)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>🎓</div>
                <div>
                  <div style={{
                    fontSize: 22, fontWeight: 800,
                    background: 'linear-gradient(135deg, var(--text) 30%, var(--accent))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    lineHeight: 1.1,
                  }}>ETEC Fès</div>
                  <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>
                    L'innovation est dans notre ADN
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, minHeight: 20 }}>
                {typed}
                <span style={{
                  display: 'inline-block', width: 2, height: 13,
                  background: 'var(--accent)', marginLeft: 2, verticalAlign: 'middle',
                  animation: 'aiCursor 0.8s ease-in-out infinite',
                }} />
              </p>
              {subtitle && (
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>{subtitle}</p>
              )}
            </div>

            {/* Right: role badge + live dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#10B981', display: 'inline-block',
                animation: 'aiPulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Système actif</span>
              {badge.label && (
                <span style={{
                  marginLeft: 8, padding: '3px 10px', borderRadius: 20,
                  background: `${badge.color}18`, border: `1px solid ${badge.color}40`,
                  fontSize: 12, fontWeight: 600, color: badge.color,
                }}>{badge.label}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BRAND BAR ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 10, marginBottom: 24,
      }}>
        {BRAND_CARDS.map((c, i) => (
          <BrandCard key={c.label} {...c} delay={i * 65} />
        ))}
      </div>
    </>
  );
};

export default ETECHero;
