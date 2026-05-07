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
      const step = num / (1500 / 16);
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

const getNoteColor = (n) => n >= 14 ? '#10B981' : n >= 10 ? '#F59E0B' : '#EF4444';

/* ── Circular Grade Ring (CSS conic-gradient) ── */
const GradeRing = ({ value, max = 20 }) => {
  const [prog, setProg] = useState(0);
  useEffect(() => { const t = setTimeout(() => setProg(value ?? 0), 400); return () => clearTimeout(t); }, [value]);
  const pct = Math.min((prog / max) * 100, 100);
  const color = value != null ? getNoteColor(value) : '#94A3B8';
  const size = 130;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 16px' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {/* Progress */}
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s, stroke 0.4s' }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 26, fontWeight: 900, color,
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {value != null ? value.toFixed(1) : '—'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>/20</div>
      </div>
    </div>
  );
};

/* ── Stat Card ── */
const StatCard = ({ icon, displayValue, label, color, index, onClick, suffix = '' }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}08` : 'var(--surface)',
        border: `1.5px solid ${hov ? color + '60' : 'var(--border)'}`,
        borderRadius: 20, padding: '22px 18px',
        cursor: 'pointer',
        transform: hov ? 'translateY(-6px) scale(1.02)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: hov ? `0 14px 32px ${color}20` : 'var(--shadow-sm)',
        animation: `cardEntrance 0.6s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.1 + 0.2}s both`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}40)`,
        opacity: hov ? 1 : 0.3, transition: 'opacity 0.3s',
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
        fontSize: 30, fontWeight: 900, color: hov ? color : 'var(--text)',
        lineHeight: 1, marginBottom: 5, transition: 'color 0.3s',
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px',
      }}>
        {displayValue}
        {suffix && <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.6 }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
    </div>
  );
};

/* ── Module progress row ── */
const ModuleRow = ({ module: m, index }) => {
  const [prog, setProg] = useState(0);
  useEffect(() => { const t = setTimeout(() => setProg(m.moyenne ?? 0), 200 + index * 80); return () => clearTimeout(t); }, [m.moyenne, index]);
  const pct = Math.min((prog / 20) * 100, 100);
  const color = m.moyenne != null ? getNoteColor(m.moyenne) : '#94A3B8';

  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
      animation: `cardEntrance 0.4s ease ${0.35 + index * 0.06}s both`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.module_nom}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {m.notes?.slice(0, 3).map((n, j) => (
            <span key={j} style={{
              fontSize: 11, fontWeight: 600,
              padding: '1px 7px', borderRadius: 8,
              background: n.note >= 10 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: n.note >= 10 ? '#10B981' : '#EF4444',
              border: `1px solid ${n.note >= 10 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>{n.note?.toFixed(1)}</span>
          ))}
          <span style={{ fontSize: 13, fontWeight: 800, color, minWidth: 44, textAlign: 'right' }}>
            {m.moyenne != null ? m.moyenne.toFixed(2) : '—'}/20
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 10, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 10,
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          width: `${pct}%`,
          transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${0.3 + index * 0.07}s`,
        }} />
      </div>
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
        borderRadius: 16, padding: '16px 10px',
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8,
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'translateY(-4px) scale(1.05)' : 'scale(1)',
        boxShadow: hov ? `0 8px 24px ${color}20` : 'none',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: hov ? `${color}20` : `${color}10`,
        border: `1px solid ${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'rotate(-8deg) scale(1.1)' : 'scale(1)',
      }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: hov ? color : 'var(--text-muted)' }}>{label}</span>
    </button>
  );
};

/* ============================================================
   ETUDIANT DASHBOARD
   ============================================================ */
const EtudiantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bulletin, setBulletin] = useState(null);
  const [absenceSummary, setAbsenceSummary] = useState(null);
  const [planning, setPlanning] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/notes/bulletin'),
      api.get('/absences/summary').catch(() => ({ data: null })),
      api.get('/planning').catch(() => ({ data: [] })),
    ]).then(([bRes, aRes, pRes]) => {
      const b = bRes.data;
      if (b && !Array.isArray(b.modules)) b.modules = [];
      setBulletin(b);
      setAbsenceSummary(aRes.data);
      setPlanning(Array.isArray(pRes.data) ? pRes.data : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const moyenne = bulletin?.moyenneGenerale ?? null;
  const nbModules = bulletin?.modules?.length ?? 0;
  const totalAbsences = absenceSummary?.totalAbsences ?? 0;

  const moyCount = useCounter(moyenne != null ? Math.round(moyenne * 10) : 0, 200);
  const modCount = useCounter(nbModules, 300);
  const absCount = useCounter(totalAbsences, 400);

  // Today's sessions
  const jourActuel = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][new Date().getDay()];
  const coursAujourdhui = planning.filter(p => p.jour === jourActuel);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '55vh', gap: 14 }}>
      <div style={{ width: 42, height: 42, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement de votre espace...</span>
    </div>
  );

  const absColor = totalAbsences > 5 ? '#EF4444' : totalAbsences > 2 ? '#F59E0B' : '#10B981';

  return (
    <div>
      {/* ── HERO ── */}
      <ETECHero user={user} subtitle="Espace Étudiant — vos notes, absences et planning en un coup d'œil" />

      {/* ── STAT CARDS ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        <StatCard
          icon="📊"
          displayValue={moyenne != null ? (moyCount / 10).toFixed(1) : '—'}
          label="Moyenne Générale"
          color={moyenne != null ? getNoteColor(moyenne) : '#0EA5E9'}
          index={0}
          suffix={moyenne != null ? '/20' : ''}
          onClick={() => navigate('/etudiant/notes')}
        />
        <StatCard
          icon="📚"
          displayValue={modCount}
          label="Modules"
          color="#7C3AED"
          index={1}
          onClick={() => navigate('/etudiant/notes')}
        />
        <StatCard
          icon="📅"
          displayValue={absCount}
          label="Absences"
          color={absColor}
          index={2}
          onClick={() => navigate('/etudiant/absences')}
        />
        <StatCard
          icon="🗓️"
          displayValue={coursAujourdhui.length}
          label="Cours aujourd'hui"
          color="#0EA5E9"
          index={3}
          onClick={() => navigate('/etudiant/planning')}
        />
      </div>

      {/* ── MIDDLE: Notes + Absences ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Bulletin card */}
        <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.4s both' }}>
          <div className="card-header">
            <div>
              <h3 style={{ margin: 0 }}>📝 Mon Bulletin</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {nbModules} module{nbModules !== 1 ? 's' : ''} • {new Date().getFullYear()}
              </p>
            </div>
            {/* Grade ring */}
            <div style={{ textAlign: 'center' }}>
              <GradeRing value={moyenne} />
              <div style={{
                fontSize: 11.5, fontWeight: 700,
                color: moyenne != null ? getNoteColor(moyenne) : 'var(--text-muted)',
              }}>
                {moyenne != null
                  ? moyenne >= 14 ? '🏆 Très bien'
                    : moyenne >= 10 ? '✅ Admis'
                    : '⚠️ En difficulté'
                  : 'Pas de notes'}
              </div>
            </div>
          </div>
          <div className="card-body" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {!bulletin?.modules?.length ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Aucune note disponible pour le moment
              </div>
            ) : bulletin.modules.map((m, i) => (
              <ModuleRow key={i} module={m} index={i} />
            ))}
          </div>
          <div style={{ padding: '10px 20px 16px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => navigate('/etudiant/notes')}
              style={{
                width: '100%', padding: '10px', borderRadius: 12,
                background: 'var(--accent)', border: 'none',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.target.style.opacity = '0.85'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              Voir tous mes résultats →
            </button>
          </div>
        </div>

        {/* Right column: Absences + Today's schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Absences summary */}
          <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.5s both', flex: 1 }}>
            <div className="card-header">
              <h3 style={{ margin: 0 }}>📅 Mes Absences</h3>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: `${absColor}10`, color: absColor,
                border: `1px solid ${absColor}30`,
              }}>{totalAbsences} abs.</span>
            </div>
            <div className="card-body">
              {!absenceSummary?.summary?.length ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Aucune absence !</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Continue comme ça 💪</div>
                </div>
              ) : absenceSummary.summary.slice(0, 4).map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < Math.min(absenceSummary.summary.length, 4) - 1 ? '1px solid var(--border)' : 'none',
                  animation: `cardEntrance 0.35s ease ${0.55 + i * 0.06}s both`,
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.module_nom}
                  </span>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 600 }}>
                      ✓ {s.justifiees}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>
                      ✗ {s.non_justifiees}
                    </span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/etudiant/absences')}
                style={{
                  marginTop: 12, width: '100%', padding: '8px', borderRadius: 10,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}
              >Voir le détail →</button>
            </div>
          </div>

          {/* Today's schedule */}
          <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.6s both' }}>
            <div className="card-header">
              <h3 style={{ margin: 0 }}>🗓️ Aujourd'hui</h3>
              <span style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 10, border: '1px solid var(--border)',
              }}>{jourActuel}</span>
            </div>
            <div className="card-body">
              {!coursAujourdhui.length ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  🏖️ Pas de cours aujourd'hui
                </div>
              ) : coursAujourdhui.slice(0, 3).map((c, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '7px 0',
                  borderBottom: i < coursAujourdhui.slice(0,3).length - 1 ? '1px solid var(--border)' : 'none',
                  animation: `cardEntrance 0.35s ease ${0.65 + i * 0.07}s both`,
                }}>
                  <div style={{
                    background: 'var(--accent)', color: '#000', borderRadius: 8,
                    padding: '3px 7px', fontSize: 10.5, fontWeight: 700,
                    whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start',
                  }}>{c.heure_debut?.slice(0,5)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.module_nom || c.module?.nom || 'Module'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      📍 {c.salle || '—'} • {c.prof_nom || c.professeur?.nom || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.7s both' }}>
        <div className="card-header"><h3>⚡ Accès rapide</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { icon: '📝', label: 'Mon Bulletin',  color: '#10B981', path: '/etudiant/notes'     },
              { icon: '📅', label: 'Mes Absences',  color: '#F59E0B', path: '/etudiant/absences'  },
              { icon: '🗓️', label: 'Mon Planning',  color: '#0EA5E9', path: '/etudiant/planning'  },
              { icon: '💰', label: 'Paiements',     color: '#7C3AED', path: '/etudiant/paiements' },
            ].map((item) => (
              <QuickBtn key={item.label} {...item} navigate={navigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtudiantDashboard;
