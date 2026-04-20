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

const EtudiantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bulletin, setBulletin] = useState(null);
  const [absenceSummary, setAbsenceSummary] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/notes/bulletin'),
      api.get('/absences/summary'),
    ]).then(([bulRes, absRes]) => {
      const b = bulRes.data;
      if (!Array.isArray(b?.modules)) b && (b.modules = []);
      setBulletin(b);
      setAbsenceSummary(absRes.data);
    }).catch(console.error);
  }, []);

  const moyenne = bulletin?.moyenneGenerale ?? null;
  const nbModules = bulletin?.modules?.length ?? 0;
  const totalAbsences = absenceSummary?.totalAbsences ?? 0;

  const moyCount = useCounter(moyenne != null ? moyenne * 10 : 0, 200);
  const modCount = useCounter(nbModules, 300);
  const absCount = useCounter(totalAbsences, 400);

  const getNoteColor = (n) => n >= 14 ? '#10B981' : n >= 10 ? '#F59E0B' : '#EF4444';

  return (
    <div>
      {/* ── ETEC HERO ── */}
      <ETECHero user={user} subtitle="Espace Étudiant — consultez vos notes, absences et planning" />

      {/* ── STAT CARDS ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <StatCard
          icon="📊"
          displayValue={moyenne != null ? (moyCount / 10).toFixed(2) : '—'}
          label="Moyenne Générale"
          color={moyenne != null ? getNoteColor(moyenne) : '#0EA5E9'}
          delay={0} index={0}
          onClick={() => navigate('/etudiant/notes')}
          suffix="/20"
        />
        <StatCard
          icon="📚"
          displayValue={modCount}
          label="Modules"
          color="#7C3AED"
          delay={100} index={1}
          onClick={() => navigate('/etudiant/notes')}
        />
        <StatCard
          icon="📅"
          displayValue={absCount}
          label="Total Absences"
          color={totalAbsences > 5 ? '#EF4444' : '#10B981'}
          delay={200} index={2}
          onClick={() => navigate('/etudiant/absences')}
        />
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="card mb-24" style={{ animation: 'cardEntrance 0.6s ease 0.4s both' }}>
        <div className="card-header"><h3>⚡ Accès rapide</h3></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: '📝', label: 'Mon Bulletin',  path: '/etudiant/notes',    color: '#10B981' },
            { icon: '📅', label: 'Mes Absences',  path: '/etudiant/absences', color: '#F59E0B' },
            { icon: '🗓️', label: 'Mon Planning',  path: '/etudiant/planning', color: '#0EA5E9' },
            { icon: '💰', label: 'Paiements',     path: '/etudiant/paiements',color: '#7C3AED' },
          ].map((item, i) => (
            <QuickBtn key={item.label} {...item} delay={i * 70} onClick={() => navigate(item.path)} />
          ))}
        </div>
      </div>

      {/* ── BULLETIN TABLE ── */}
      <div className="card mb-24" style={{ animation: 'cardEntrance 0.6s ease 0.55s both' }}>
        <div className="card-header">
          <h3>📝 Mes Notes</h3>
          {moyenne != null && (
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: `${getNoteColor(moyenne)}18`,
              color: getNoteColor(moyenne),
              border: `1px solid ${getNoteColor(moyenne)}40`,
            }}>
              Moy. générale: {moyenne.toFixed(2)}/20
            </span>
          )}
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Coef.</th>
                <th>Notes</th>
                <th>Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {!bulletin?.modules?.length ? (
                <tr><td colSpan="4" className="text-center text-muted" style={{ padding: 30 }}>
                  Aucune note disponible
                </td></tr>
              ) : bulletin.modules.map((m, i) => (
                <tr key={i} style={{ animation: `cardEntrance 0.3s ease ${0.6 + i * 0.05}s both` }}>
                  <td><strong>{m.module_nom}</strong></td>
                  <td>{m.coefficient}</td>
                  <td>
                    <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                      {m.notes.map((n, j) => (
                        <span key={j} style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 11.5, fontWeight: 600,
                          background: n.note >= 10 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: n.note >= 10 ? '#10B981' : '#EF4444',
                          border: `1px solid ${n.note >= 10 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {n.type}: {n.note.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {m.moyenne != null ? (
                      <span style={{
                        fontWeight: 700, fontSize: 14,
                        color: getNoteColor(m.moyenne),
                      }}>
                        {m.moyenne.toFixed(2)}/20
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ABSENCES TABLE ── */}
      <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.7s both' }}>
        <div className="card-header">
          <h3>📅 Mes Absences</h3>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: totalAbsences > 5 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            color: totalAbsences > 5 ? '#EF4444' : '#10B981',
            border: `1px solid ${totalAbsences > 5 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
          }}>
            {totalAbsences} absence(s)
          </span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Total</th>
                <th>Justifiées</th>
                <th>Non justifiées</th>
              </tr>
            </thead>
            <tbody>
              {!absenceSummary?.summary?.length ? (
                <tr><td colSpan="4" className="text-center text-muted" style={{ padding: 30 }}>
                  Aucune absence 🎉
                </td></tr>
              ) : absenceSummary.summary.map((s, i) => (
                <tr key={i}>
                  <td><strong>{s.module_nom}</strong></td>
                  <td><strong>{s.total_absences}</strong></td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 600 }}>{s.justifiees}</span></td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }}>{s.non_justifiees}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── Stat card ── */
const StatCard = ({ icon, displayValue, label, color, delay, index, onClick, suffix = '' }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${color}10` : 'var(--surface)',
        border: `1.5px solid ${hovered ? color : 'var(--border)'}`,
        borderRadius: 20, padding: '22px 18px',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-7px) scale(1.03)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: hovered ? `0 16px 35px ${color}30` : '0 2px 8px rgba(0,0,0,0.05)',
        animation: `cardEntrance 0.6s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.1 + 0.2}s both`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14, marginBottom: 12,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        animation: hovered ? 'iconBounce 0.4s ease' : `iconFloat 3s ease-in-out ${delay / 1000}s infinite`,
      }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: hovered ? color : 'var(--text)', lineHeight: 1, marginBottom: 5, transition: 'color 0.3s' }}>
        {displayValue}{suffix && <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
        borderRadius: '0 0 20px 20px',
      }} />
    </div>
  );
};

/* ── Quick action button ── */
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
        borderRadius: 14, padding: '14px 8px',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'scale(1.07)' : 'scale(1)',
        boxShadow: hovered ? `0 6px 20px ${color}30` : 'none',
        animation: `cardEntrance 0.5s ease ${0.45 + delay / 1000}s both`,
      }}
    >
      <span style={{ fontSize: 24, animation: hovered ? 'iconBounce 0.4s ease' : 'none' }}>{icon}</span>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: hovered ? color : 'var(--text)' }}>{label}</span>
    </button>
  );
};

export default EtudiantDashboard;
