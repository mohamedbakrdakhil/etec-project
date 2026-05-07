import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ETECHero from '../components/ETECHero';

/* ── Animated counter ── */
const useCounter = (target, delay = 0) => {
  const [count, setCount] = useState(0);
  const num = Number(target) || 0;
  useEffect(() => {
    if (num <= 0) { setCount(0); return; }
    const t = setTimeout(() => {
      let s = 0;
      const step = num / (1400 / 16);
      const timer = setInterval(() => {
        s += step;
        if (s >= num) { setCount(num); clearInterval(timer); }
        else setCount(Math.floor(s));
      }, 16);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(t);
  }, [num, delay]);
  return count;
};

/* ── Stat Card ── */
const StatCard = ({ icon, value, label, color, index, onClick }) => {
  const count = useCounter(Number(value) || 0, index * 120);
  const [hov, setHov] = useState(false);
  const isNum = !isNaN(Number(value));
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}08` : 'var(--surface)',
        border: `1.5px solid ${hov ? color + '60' : 'var(--border)'}`,
        borderRadius: 20, padding: '22px 18px',
        cursor: onClick ? 'pointer' : 'default',
        transform: hov ? 'translateY(-6px) scale(1.02)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: hov ? `0 14px 32px ${color}20` : 'var(--shadow-sm)',
        animation: `cardEntrance 0.55s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.1 + 0.2}s both`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}40)`,
        opacity: hov ? 1 : 0.35, transition: 'opacity 0.3s',
        borderRadius: '20px 20px 0 0',
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: 14, marginBottom: 12,
        background: `${color}12`, border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'rotate(-8deg) scale(1.1)' : 'scale(1)',
      }}>{icon}</div>
      <div style={{
        fontSize: 32, fontWeight: 900, color: hov ? color : 'var(--text)',
        lineHeight: 1, marginBottom: 5, transition: 'color 0.3s',
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px',
      }}>
        {isNum ? count : value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
    </div>
  );
};

/* ── Day Schedule Timeline ── */
const JOURS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const JOUR_SHORT = { lundi:'Lun', mardi:'Mar', mercredi:'Mer', jeudi:'Jeu', vendredi:'Ven', samedi:'Sam' };
const SESSION_COLORS = ['#0EA5E9','#10B981','#7C3AED','#F59E0B','#EF4444','#06D6A0'];

const SessionCard = ({ session, index }) => {
  const [hov, setHov] = useState(false);
  const color = SESSION_COLORS[index % SESSION_COLORS.length];
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'stretch', gap: 0,
        borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${hov ? color + '50' : 'var(--border)'}`,
        background: hov ? `${color}06` : 'var(--surface)',
        transition: 'all 0.25s ease',
        transform: hov ? 'translateX(3px)' : 'translateX(0)',
        animation: `cardEntrance 0.4s ease ${0.35 + index * 0.07}s both`,
      }}
    >
      {/* Left color bar */}
      <div style={{ width: 4, background: color, flexShrink: 0 }} />
      {/* Time box */}
      <div style={{
        background: `${color}10`, padding: '10px 12px',
        borderRight: `1px solid ${color}20`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minWidth: 58, flexShrink: 0,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1 }}>
          {session.heure_debut?.slice(0,5)}
        </div>
        <div style={{ fontSize: 9, color: `${color}80`, marginTop: 2 }}>
          {session.heure_fin?.slice(0,5)}
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: '10px 14px', flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.module_nom || 'Module'}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
          {session.groupe_nom && <span>👥 {session.groupe_nom}</span>}
          {session.salle && <span style={{ marginLeft: 8 }}>📍 {session.salle}</span>}
        </div>
      </div>
    </div>
  );
};

/* ── Weekly Planning Grid ── */
const WeekGrid = ({ planning, jourActuel }) => {
  const byDay = {};
  JOURS.forEach(j => { byDay[j] = planning.filter(p => p.jour === j); });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
      {JOURS.map((jour, i) => {
        const sessions = byDay[jour];
        const isToday = jour === jourActuel;
        return (
          <div key={jour} style={{
            background: isToday ? 'rgba(6,214,160,0.06)' : 'var(--surface-2)',
            border: `1.5px solid ${isToday ? 'rgba(6,214,160,0.4)' : 'var(--border)'}`,
            borderRadius: 12, padding: '10px 8px', minHeight: 80,
            animation: `cardEntrance 0.4s ease ${0.3 + i * 0.06}s both`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 8,
              color: isToday ? 'var(--accent)' : 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>{JOUR_SHORT[jour]}</div>
            {sessions.length === 0 ? (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', opacity: 0.5 }}>—</div>
            ) : sessions.map((s, j) => (
              <div key={j} style={{
                background: SESSION_COLORS[j % SESSION_COLORS.length] + '18',
                border: `1px solid ${SESSION_COLORS[j % SESSION_COLORS.length]}30`,
                borderRadius: 6, padding: '3px 5px', marginBottom: 4, cursor: 'default',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: SESSION_COLORS[j % SESSION_COLORS.length] }}>
                  {s.heure_debut?.slice(0,5)}
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.module_nom || 'Module'}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

/* ── Quick action button ── */
const QuickBtn = ({ icon, label, color, path, navigate }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => navigate(path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}12` : 'var(--surface-2)',
        border: `1.5px solid ${hov ? color + '60' : 'var(--border)'}`,
        borderRadius: 16, padding: '18px 10px',
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8,
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'translateY(-4px) scale(1.05)' : 'scale(1)',
        boxShadow: hov ? `0 8px 24px ${color}20` : 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: hov ? `${color}20` : `${color}10`,
        border: `1px solid ${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'rotate(-8deg) scale(1.1)' : 'scale(1)',
      }}>{icon}</div>
      <span style={{ fontSize: 12, fontWeight: 600, color: hov ? color : 'var(--text-muted)' }}>{label}</span>
    </button>
  );
};

/* ============================================================
   PROF DASHBOARD
   ============================================================ */
const ProfDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [planning, setPlanning] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/planning')
      .then(r => setPlanning(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const jourActuel = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][today.getDay()];
  const coursAujourdhui = planning.filter(p => p.jour === jourActuel);

  // Unique groupes
  const groupes = [...new Set(planning.map(p => p.groupe_nom).filter(Boolean))];
  // Unique modules
  const modules = [...new Set(planning.map(p => p.module_nom).filter(Boolean))];

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '55vh', gap: 14 }}>
      <div style={{ width: 42, height: 42, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement de votre espace...</span>
    </div>
  );

  return (
    <div>
      {/* ── HERO ── */}
      <ETECHero user={user} subtitle="Espace Professeur — vos cours, notes et absences en un coup d'œil" />

      {/* ── STAT CARDS ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        <StatCard icon="📚" value={planning.length}        label="Séances / semaine" color="#0EA5E9" index={0} onClick={() => navigate('/prof/planning')} />
        <StatCard icon="📅" value={coursAujourdhui.length} label="Cours aujourd'hui"  color="#10B981" index={1} />
        <StatCard icon="👨‍🎓" value={groupes.length}         label="Groupes"            color="#7C3AED" index={2} />
        <StatCard icon="📖" value={modules.length}         label="Modules enseignés"  color="#F59E0B" index={3} />
      </div>

      {/* ── TODAY + WEEK GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 20, marginBottom: 24 }}>

        {/* Today's schedule */}
        <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.42s both' }}>
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0 }}>📅 Aujourd'hui</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{jourActuel}</p>
            </div>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: coursAujourdhui.length ? 'rgba(6,214,160,0.1)' : 'var(--surface-2)',
              color: coursAujourdhui.length ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${coursAujourdhui.length ? 'rgba(6,214,160,0.3)' : 'var(--border)'}`,
            }}>{coursAujourdhui.length} cours</span>
          </div>
          <div className="card-body">
            {coursAujourdhui.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>☕</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Pas de cours aujourd'hui</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Profitez de votre journée !</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {coursAujourdhui.map((c, i) => (
                  <SessionCard key={c.id || i} session={c} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Week planning */}
        <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.52s both' }}>
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0 }}>🗓️ Planning hebdomadaire</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{planning.length} séances cette semaine</p>
            </div>
            <button
              onClick={() => navigate('/prof/planning')}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '5px 12px', fontSize: 12,
                color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600,
              }}
            >Détail →</button>
          </div>
          <div className="card-body">
            <WeekGrid planning={planning} jourActuel={jourActuel} />
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.62s both' }}>
        <div className="card-header">
          <h3>⚡ Mes outils</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { icon: '📝', label: 'Saisie des Notes',    color: '#10B981', path: '/prof/notes'    },
              { icon: '📅', label: 'Saisie des Absences', color: '#F59E0B', path: '/prof/absences' },
              { icon: '🗓️', label: 'Mon Planning',        color: '#0EA5E9', path: '/prof/planning' },
            ].map((item) => (
              <QuickBtn key={item.label} {...item} navigate={navigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfDashboard;
