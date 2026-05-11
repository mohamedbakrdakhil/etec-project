import React, { useState, useEffect } from 'react';

/* ── Live clock ── */
const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
};

/* ── Typewriter ── */
const useTypewriter = (text, speed = 32, startDelay = 600) => {
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

/* ── Mesh gradient particles ── */
const MeshParticles = () => {
  const pts = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    size: 2 + (i % 4) * 2,
    left: (i * 4.7) % 100,
    top: (i * 7.3) % 100,
    delay: (i * 0.37) % 6,
    dur: 5 + (i % 5),
    color: i % 3 === 0 ? '#06D6A0' : i % 3 === 1 ? '#7C3AED' : '#0EA5E9',
    opacity: 0.06 + (i % 4) * 0.03,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.left}%`, top: `${p.top}%`,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          opacity: p.opacity,
          animation: `particleRise ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}
      {/* Gradient orbs */}
      <div style={{
        position: 'absolute', top: '-40%', right: '-5%',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,214,160,0.08) 0%, transparent 70%)',
        filter: 'blur(30px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30%', left: '10%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
        filter: 'blur(25px)',
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '40%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)',
        filter: 'blur(20px)',
      }} />
    </div>
  );
};

const ROLE_CONFIG = {
  developpeur: { label: 'Développeur',    color: '#7C3AED', emoji: '⚙️',  bg: 'rgba(124,58,237,0.15)'  },
  admin:       { label: 'Administration', color: '#0EA5E9', emoji: '🛡️',  bg: 'rgba(14,165,233,0.15)'  },
  professeur:  { label: 'Professeur',     color: '#F59E0B', emoji: '👨‍🏫', bg: 'rgba(245,158,11,0.15)'  },
  etudiant:    { label: 'Étudiant',       color: '#10B981', emoji: '🎒',  bg: 'rgba(16,185,129,0.15)'  },
};

const DAY_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

/* ============================================================
   ETECHero — Premium hero header shared across all dashboards
   Props: user, subtitle, rightContent
   ============================================================ */
const ETECHero = ({ user, subtitle, rightContent }) => {
  const time = useClock();
  const role = user?.role;
  const rc = ROLE_CONFIG[role] || ROLE_CONFIG.etudiant;

  const greeting = (() => {
    const h = time.getHours();
    if (h < 5)  return 'Bonne nuit';
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();
  const fullGreeting = user ? `${greeting}, ${user.prenom} ${user.nom}` : '';
  const typed = useTypewriter(fullGreeting, 30, 500);

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() : '?';
  const dateStr = `${DAY_FR[time.getDay()]} ${time.getDate()} ${MONTH_FR[time.getMonth()]} ${time.getFullYear()}`;
  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, #060B18 0%, #0D1525 40%, #0A1628 70%, #060B18 100%)',
      borderRadius: 24,
      padding: '28px 32px',
      marginBottom: 24,
      overflow: 'hidden',
      animation: 'cardEntrance 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
      border: '1px solid rgba(6,214,160,0.12)',
      boxShadow: '0 4px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(6,214,160,0.06)',
    }}>
      <MeshParticles />

      {/* Top grid line decoration */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(6,214,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,214,160,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>

        {/* ── LEFT: Branding + greeting ── */}
        <div style={{ flex: 1, minWidth: 220 }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, #06D6A0 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 4px 16px rgba(6,214,160,0.35)',
            }}>🎓</div>
            <div>
              <div style={{
                fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #FFFFFF 30%, #06D6A0 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1.1,
              }}>ETEC Fès</div>
              <div style={{
                fontSize: 9.5, color: '#06D6A0', fontWeight: 700,
                letterSpacing: 2, textTransform: 'uppercase', marginTop: 1,
                opacity: 0.8,
              }}>École de Technologie</div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block',
                boxShadow: '0 0 8px #10B981',
                animation: 'livePulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Système actif</span>
            </div>
          </div>

          {/* Greeting */}
          <div style={{ marginBottom: subtitle ? 6 : 0 }}>
            <h2 style={{
              margin: 0, fontSize: 24, fontWeight: 700, color: '#FFFFFF',
              minHeight: 28, letterSpacing: '-0.3px',
            }}>
              {typed}
              <span style={{
                display: 'inline-block', width: 2, height: 20,
                background: '#06D6A0', marginLeft: 3, verticalAlign: 'middle',
                animation: 'cursorBlink 0.8s ease-in-out infinite',
              }} />
            </h2>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* ── RIGHT: User card + clock ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

          {/* Clock card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '10px 16px',
            textAlign: 'center', backdropFilter: 'blur(10px)',
            minWidth: 110,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#06D6A0', letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}>
              {timeStr.slice(0, 5)}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: 500 }}>
              {dateStr}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
              :{timeStr.slice(6)}
            </div>
          </div>

          {/* User avatar + role */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '10px 16px',
            backdropFilter: 'blur(10px)',
          }}>
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${rc.color}40, ${rc.color}20)`,
              border: `1.5px solid ${rc.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: rc.color,
              boxShadow: `0 4px 16px ${rc.color}20`,
            }}>{initials}</div>

            {/* Info */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                padding: '2px 8px', borderRadius: 20,
                background: rc.bg,
                border: `1px solid ${rc.color}40`,
              }}>
                <span style={{ fontSize: 11 }}>{rc.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: rc.color }}>{rc.label}</span>
              </div>
            </div>
          </div>

          {/* Optional extra content from parent */}
          {rightContent}
        </div>
      </div>
    </div>
  );
};

export default ETECHero;
