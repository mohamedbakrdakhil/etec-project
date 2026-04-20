import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ---- Animated counter hook ---- */
const useCounter = (target, duration = 1800, delay = 0) => {
  const [count, setCount] = useState(0);
  const num = Number(target) || 0;
  useEffect(() => {
    if (num <= 0) { setCount(0); return; }
    const timeout = setTimeout(() => {
      let start = 0;
      const step = num / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= num) { setCount(num); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [num, duration, delay]);
  return count;
};

/* ---- Floating particles background ---- */
const Particles = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: 3 + Math.random() * 5,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    opacity: 0.08 + Math.random() * 0.12,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          bottom: -20,
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: 'var(--accent)',
          opacity: p.opacity,
          animation: `particleRise ${p.duration}s ease-in ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
};

/* ---- Stat card ---- */
const StatCard = ({ icon, value, label, color, index, onClick }) => {
  const count = useCounter(value, 1600, index * 120);
  const [hovered, setHovered] = useState(false);

  const colors = {
    blue:   { bg: 'rgba(14,165,233,0.12)',  glow: 'rgba(14,165,233,0.35)',  border: '#0EA5E9' },
    green:  { bg: 'rgba(16,185,129,0.12)',  glow: 'rgba(16,185,129,0.35)',  border: '#10B981' },
    orange: { bg: 'rgba(245,158,11,0.12)',  glow: 'rgba(245,158,11,0.35)',  border: '#F59E0B' },
    red:    { bg: 'rgba(239,68,68,0.12)',   glow: 'rgba(239,68,68,0.35)',   border: '#EF4444' },
    purple: { bg: 'rgba(124,58,237,0.12)',  glow: 'rgba(124,58,237,0.35)',  border: '#7C3AED' },
    teal:   { bg: 'rgba(6,214,160,0.12)',   glow: 'rgba(6,214,160,0.35)',   border: 'var(--accent)' },
  };
  const c = colors[color] || colors.teal;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? c.bg : 'var(--surface)',
        border: `1.5px solid ${hovered ? c.border : 'var(--border)'}`,
        borderRadius: 20,
        padding: '24px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-8px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 20px 40px ${c.glow}, 0 0 0 1px ${c.border}` : '0 2px 8px rgba(0,0,0,0.06)',
        animation: `cardEntrance 0.6s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.08}s both`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer sweep on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(105deg, transparent 40%, ${c.bg} 50%, transparent 60%)`,
          animation: 'shimmerSweep 0.8s ease forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: c.bg,
        border: `1px solid ${c.border}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, marginBottom: 14,
        animation: hovered ? `iconBounce 0.5s ease` : 'iconFloat 3s ease-in-out infinite',
        animationDelay: `${index * 0.3}s`,
        transition: 'transform 0.3s ease',
      }}>
        {icon}
      </div>

      {/* Number */}
      <div style={{
        fontSize: 36, fontWeight: 800,
        color: hovered ? c.border : 'var(--text)',
        lineHeight: 1, marginBottom: 6,
        transition: 'color 0.3s ease',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {count.toLocaleString()}
      </div>

      {/* Label */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
        {label}
      </div>

      {/* Bottom glow bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${c.border}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        borderRadius: '0 0 20px 20px',
      }} />
    </div>
  );
};

/* ---- Typewriter hook ---- */
const useTypewriter = (text, speed = 40, startDelay = 800) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timeout = setTimeout(() => {
      const timer = setInterval(() => {
        setDisplayed(text.slice(0, ++i));
        if (i >= text.length) clearInterval(timer);
      }, speed);
      return () => clearInterval(timer);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  return displayed;
};

/* ============================================================
   MAIN DASHBOARD
   ============================================================ */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = user?.role === 'developpeur' ? '/dev' : '/admin';

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(console.error);
    api.get('/logs?limit=5').then(r => setRecentLogs(Array.isArray(r.data) ? r.data.slice(0, 5) : [])).catch(() => {});
  }, []);

  const greeting = user ? `Bienvenue, ${user.prenom} ${user.nom} 👋` : '';
  const typedGreeting = useTypewriter(greeting, 35, 600);

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p className="text-muted">Chargement du tableau de bord...</p>
    </div>
  );

  const cards = [
    { icon: '👥', value: stats.totalUsers,     label: 'Utilisateurs', color: 'blue',   path: `${base}/users`   },
    { icon: '👨‍🏫', value: stats.totalProfs,     label: 'Professeurs',  color: 'purple', path: `${base}/users`   },
    { icon: '🎒', value: stats.totalEtudiants, label: 'Étudiants',    color: 'green',  path: `${base}/users`   },
    { icon: '🎓', value: stats.totalFilieres,  label: 'Filières',     color: 'orange', path: `${base}/filieres` },
    { icon: '📋', value: stats.totalGroupes,   label: 'Groupes',      color: 'red',    path: `${base}/groupes`  },
    { icon: '📚', value: stats.totalModules,   label: 'Modules',      color: 'teal',   path: `${base}/modules`  },
  ];

  return (
    <div style={{ position: 'relative' }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(6,214,160,0.06) 0%, rgba(124,58,237,0.06) 50%, rgba(14,165,233,0.04) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '32px 32px 28px',
        marginBottom: 28,
        overflow: 'hidden',
        animation: 'cardEntrance 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <Particles />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--accent), #7C3AED)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>🎓</div>
                <div>
                  <h2 style={{
                    fontSize: 26, fontWeight: 800, margin: 0,
                    background: 'linear-gradient(135deg, var(--text) 30%, var(--accent))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    ETEC Fès
                  </h2>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                    L'innovation est dans notre ADN
                  </p>
                </div>
              </div>
              <p style={{ margin: '10px 0 0', color: 'var(--text-muted)', fontSize: 14.5, minHeight: 22 }}>
                {typedGreeting}
                <span style={{ animation: 'aiCursor 0.8s ease-in-out infinite', display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'middle' }} />
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'aiPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Système actif</span>
              <span className="badge badge-blue" style={{ marginLeft: 8 }}>
                {user?.role === 'developpeur' ? 'Développeur' : 'Administration'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {cards.map((c, i) => (
          <StatCard key={c.label} {...c} index={i} onClick={() => navigate(c.path)} />
        ))}
      </div>

      {/* ── ETEC BRANDING BAR ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}>
        {[
          { icon: '🏛️', value: '1985',          label: 'Année de fondation',      color: '#7C3AED' },
          { icon: '✅', value: '2005',           label: 'Accréditée depuis',        color: '#10B981' },
          { icon: '📅', value: `${new Date().getFullYear() - 1985}+`, label: 'Ans d\'expérience', color: '#F59E0B' },
          { icon: '📍', value: 'Fès',            label: 'Maroc',                    color: '#0EA5E9' },
          { icon: '🤝', value: 'FEDE · FIEP',   label: 'Partenariats',             color: '#EF4444' },
          { icon: '💡', value: 'Innovation',     label: 'Dans notre ADN',           color: '#06D6A0' },
        ].map((item, i) => (
          <BrandCard key={item.label} {...item} delay={i * 70} />
        ))}
      </div>

      {/* ── BOTTOM ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Quick Actions */}
        <div className="card" style={{ animation: 'cardEntrance 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s both' }}>
          <div className="card-header">
            <h3>⚡ Accès rapide</h3>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '👥', label: 'Utilisateurs', path: `${base}/users`,        color: '#0EA5E9' },
              { icon: '👨‍🎓', label: 'Groupes',      path: `${base}/groupes`,      color: '#7C3AED' },
              { icon: '📝', label: 'Notes',         path: `${base}/notes`,        color: '#10B981' },
              { icon: '📅', label: 'Absences',      path: `${base}/absences`,     color: '#F59E0B' },
              { icon: '🗓️', label: 'Planning',      path: `${base}/planning`,     color: '#06D6A0' },
              { icon: '💰', label: 'Paiements',     path: `${base}/paiements`,    color: '#EF4444' },
            ].map((item, i) => (
              <QuickBtn key={item.label} {...item} delay={i * 60} onClick={() => navigate(item.path)} />
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card" style={{ animation: 'cardEntrance 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.65s both' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🕐 Activité récente</h3>
            <span style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', animation: 'aiPulse 2s ease-in-out infinite' }} />
          </div>
          <div className="card-body">
            {recentLogs.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 13 }}>Aucune activité récente.</p>
            ) : recentLogs.map((log, i) => (
              <div key={log.id || i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
                borderBottom: i < recentLogs.length - 1 ? '1px solid var(--border)' : 'none',
                animation: `cardEntrance 0.4s ease ${0.7 + i * 0.08}s both`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0,
                }}>
                  {log.action?.includes('login') ? '🔑' : log.action?.includes('create') ? '➕' : log.action?.includes('delete') ? '🗑️' : '📝'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>
                    {log.prenom} {log.nom}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                    {log.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---- Brand info card ---- */
const BrandCard = ({ icon, value, label, color, delay }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay + 800); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, color: color }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
};

/* ---- Quick action button ---- */
const QuickBtn = ({ icon, label, color, delay, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${color}18` : 'var(--surface-2)',
        border: `1.5px solid ${hovered ? color : 'var(--border)'}`,
        borderRadius: 12, padding: '10px 8px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        animation: `cardEntrance 0.5s ease ${0.55 + delay / 1000}s both`,
        boxShadow: hovered ? `0 4px 16px ${color}30` : 'none',
      }}
    >
      <span style={{ fontSize: 18, animation: hovered ? 'iconBounce 0.4s ease' : 'none' }}>{icon}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: hovered ? color : 'var(--text)' }}>{label}</span>
    </button>
  );
};

export default Dashboard;
