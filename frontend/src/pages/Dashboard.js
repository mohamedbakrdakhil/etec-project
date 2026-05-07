import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ETECHero from '../components/ETECHero';

/* ── Animated counter ── */
const useCounter = (target, duration = 1600, delay = 0) => {
  const [count, setCount] = useState(0);
  const num = Number(target) || 0;
  useEffect(() => {
    if (num <= 0) { setCount(0); return; }
    const t = setTimeout(() => {
      let s = 0;
      const step = num / (duration / 16);
      const timer = setInterval(() => {
        s += step;
        if (s >= num) { setCount(num); clearInterval(timer); }
        else setCount(Math.floor(s));
      }, 16);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(t);
  }, [num, duration, delay]);
  return count;
};

/* ── KPI Card ── */
const KPICard = ({ icon, value, label, color, subLabel, index, onClick }) => {
  const count = useCounter(value, 1500, index * 100);
  const [hov, setHov] = useState(false);

  const palette = {
    blue:   '#0EA5E9', green: '#10B981', orange: '#F59E0B',
    red:    '#EF4444', purple: '#7C3AED', teal: '#06D6A0',
    pink:   '#EC4899', indigo: '#6366F1',
  };
  const c = palette[color] || palette.teal;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? `linear-gradient(135deg, ${c}10 0%, ${c}06 100%)`
          : 'var(--surface)',
        border: `1.5px solid ${hov ? c + '60' : 'var(--border)'}`,
        borderRadius: 20,
        padding: '22px 20px 18px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hov ? `0 16px 40px ${c}20, 0 4px 12px rgba(0,0,0,0.06)` : 'var(--shadow-sm)',
        animation: `cardEntrance 0.55s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.07}s both`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${c}, ${c}40)`,
        borderRadius: '20px 20px 0 0',
        opacity: hov ? 1 : 0.4,
        transition: 'opacity 0.3s',
      }} />

      {/* Icon */}
      <div style={{
        width: 46, height: 46, borderRadius: 14, marginBottom: 14,
        background: `${c}15`, border: `1px solid ${c}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'scale(1.15) rotate(-5deg)' : 'scale(1)',
      }}>{icon}</div>

      {/* Value */}
      <div style={{
        fontSize: 34, fontWeight: 900, lineHeight: 1,
        color: hov ? c : 'var(--text)',
        transition: 'color 0.3s',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-1px',
        marginBottom: 4,
      }}>{count.toLocaleString()}</div>

      {/* Label */}
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {subLabel && (
        <div style={{ fontSize: 11, color: `${c}90`, fontWeight: 500 }}>{subLabel}</div>
      )}

      {/* Click hint */}
      {onClick && hov && (
        <div style={{
          position: 'absolute', bottom: 10, right: 12,
          fontSize: 10, color: c, fontWeight: 600, opacity: 0.7,
        }}>Voir →</div>
      )}
    </div>
  );
};

/* ── Distribution Bar ── */
const DistributionBar = ({ items }) => {
  const total = items.reduce((s, i) => s + (i.value || 0), 0);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 400); return () => clearTimeout(t); }, []);

  return (
    <div>
      {/* Stacked bar */}
      <div style={{
        height: 10, borderRadius: 20, overflow: 'hidden',
        display: 'flex', gap: 2, marginBottom: 16,
        background: 'var(--surface-3)',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            height: '100%',
            width: visible && total > 0 ? `${(item.value / total) * 100}%` : '0%',
            background: item.color,
            borderRadius: 20,
            transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${i * 0.15}s`,
          }} />
        ))}
      </div>

      {/* Legend rows */}
      {items.map((item, i) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 0',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            animation: `cardEntrance 0.4s ease ${0.3 + i * 0.08}s both`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: 3,
                background: item.color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 80, height: 4, borderRadius: 20,
                background: 'var(--surface-3)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: visible && total > 0 ? `${pct}%` : '0%',
                  background: item.color,
                  borderRadius: 20,
                  transition: `width 0.9s ease ${0.5 + i * 0.12}s`,
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: item.color, minWidth: 34, textAlign: 'right' }}>
                {item.value}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 38 }}>{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Activity Timeline ── */
const ACTION_ICONS = {
  login: { icon: '🔑', color: '#0EA5E9' },
  create: { icon: '➕', color: '#10B981' },
  delete: { icon: '🗑️', color: '#EF4444' },
  update: { icon: '✏️', color: '#F59E0B' },
  logout: { icon: '🚪', color: '#7C3AED' },
};
const getActionStyle = (action = '') => {
  const key = Object.keys(ACTION_ICONS).find(k => action.includes(k)) || 'create';
  return ACTION_ICONS[key];
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
};

const ActivityTimeline = ({ logs }) => {
  if (!logs.length) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
      Aucune activité récente
    </div>
  );
  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 16, top: 8, bottom: 8, width: 2,
        background: 'linear-gradient(to bottom, var(--accent), transparent)',
        opacity: 0.2, borderRadius: 2,
      }} />

      {logs.map((log, i) => {
        const as = getActionStyle(log.action);
        const initials = `${log.prenom?.[0] || ''}${log.nom?.[0] || ''}`.toUpperCase();
        return (
          <div key={log.id || i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            paddingLeft: 8, paddingBottom: 14,
            animation: `cardEntrance 0.4s ease ${0.3 + i * 0.07}s both`,
          }}>
            {/* Timeline dot */}
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: `${as.color}20`, border: `2px solid ${as.color}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, marginTop: 2, zIndex: 1,
            }}>{as.icon.slice(0, 2)}</div>

            {/* Content */}
            <div style={{
              flex: 1, background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '8px 12px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: `${as.color}15`, border: `1px solid ${as.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: as.color, flexShrink: 0,
                  }}>{initials}</div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                    {log.prenom} {log.nom}
                  </span>
                </div>
                <span style={{
                  fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0,
                  background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 10,
                }}>{timeAgo(log.created_at)}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, paddingLeft: 29 }}>
                {log.action}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Quick Action Button ── */
const QuickBtn = ({ icon, label, color, path, index, navigate }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => navigate(path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}12` : 'var(--surface)',
        border: `1.5px solid ${hov ? color + '70' : 'var(--border)'}`,
        borderRadius: 16, padding: '16px 10px',
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8,
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'translateY(-4px) scale(1.04)' : 'scale(1)',
        boxShadow: hov ? `0 8px 24px ${color}20` : 'var(--shadow-xs)',
        animation: `cardEntrance 0.5s ease ${0.45 + index * 0.05}s both`,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: hov ? `${color}20` : `${color}10`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hov ? 'rotate(-8deg) scale(1.1)' : 'rotate(0) scale(1)',
      }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: hov ? color : 'var(--text-muted)' }}>{label}</span>
    </button>
  );
};

/* ── System Health indicator ── */
const HealthBar = ({ label, value, color, max = 100, delay = 0 }) => {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), delay + 300); return () => clearTimeout(t); }, [value, delay]);
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}/{max}</span>
      </div>
      <div style={{ height: 6, borderRadius: 10, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 10,
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          width: `${w > 0 ? pct : 0}%`,
          transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${delay / 1000}s`,
        }} />
      </div>
    </div>
  );
};

/* ============================================================
   MAIN DASHBOARD (Admin / Développeur)
   ============================================================ */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = user?.role === 'developpeur' ? '/dev' : '/admin';

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/logs?limit=8').catch(() => ({ data: [] })),
    ]).then(([sRes, lRes]) => {
      setStats(sRes.data);
      setLogs(Array.isArray(lRes.data) ? lRes.data.slice(0, 7) : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '55vh', gap: 14 }}>
      <div style={{
        width: 42, height: 42, border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement du tableau de bord...</span>
    </div>
  );

  const kpiCards = [
    { icon: '👥', value: stats.totalUsers,     label: 'Utilisateurs',  color: 'blue',   path: `${base}/users`    },
    { icon: '👨‍🏫', value: stats.totalProfs,     label: 'Professeurs',   color: 'purple', path: `${base}/users`    },
    { icon: '🎒', value: stats.totalEtudiants, label: 'Étudiants',     color: 'green',  path: `${base}/users`    },
    { icon: '🎓', value: stats.totalFilieres,  label: 'Filières',      color: 'orange', path: `${base}/filieres` },
    { icon: '📋', value: stats.totalGroupes,   label: 'Groupes',       color: 'red',    path: `${base}/groupes`  },
    { icon: '📚', value: stats.totalModules,   label: 'Modules',       color: 'teal',   path: `${base}/modules`  },
  ];

  const distItems = [
    { label: 'Administrateurs', value: stats.totalAdmins  || (stats.totalUsers - stats.totalProfs - stats.totalEtudiants) || 1, color: '#0EA5E9' },
    { label: 'Professeurs',     value: stats.totalProfs     || 0, color: '#7C3AED' },
    { label: 'Étudiants',       value: stats.totalEtudiants || 0, color: '#10B981' },
  ];

  const quickActions = [
    { icon: '👥', label: 'Utilisateurs', color: '#0EA5E9', path: `${base}/users`         },
    { icon: '👨‍🎓', label: 'Groupes',      color: '#7C3AED', path: `${base}/groupes`       },
    { icon: '📝', label: 'Notes',         color: '#10B981', path: `${base}/notes`         },
    { icon: '📅', label: 'Absences',      color: '#F59E0B', path: `${base}/absences`      },
    { icon: '🗓️', label: 'Planning',      color: '#06D6A0', path: `${base}/planning`      },
    { icon: '💰', label: 'Paiements',     color: '#EF4444', path: `${base}/paiements`     },
    { icon: '🎓', label: 'Filières',      color: '#F59E0B', path: `${base}/filieres`      },
    { icon: '📋', label: 'Modules',       color: '#EC4899', path: `${base}/modules`       },
  ];

  return (
    <div>
      {/* ── HERO ── */}
      <ETECHero
        user={user}
        subtitle={`Tableau de bord ${user?.role === 'developpeur' ? 'Développeur' : 'Administration'} — vue d'ensemble du système`}
      />

      {/* ── KPI GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        {kpiCards.map((c, i) => (
          <KPICard key={c.label} {...c} index={i} onClick={() => navigate(c.path)} />
        ))}
      </div>

      {/* ── MIDDLE ROW: Distribution + Activity ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 20, marginBottom: 24,
      }}>
        {/* User Distribution */}
        <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.42s both' }}>
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>📊 Répartition des utilisateurs</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {stats.totalUsers} utilisateurs au total
              </p>
            </div>
            <button
              onClick={() => navigate(`${base}/users`)}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '5px 12px', fontSize: 12,
                color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600,
              }}
            >Voir tout →</button>
          </div>
          <div className="card-body">
            <DistributionBar items={distItems} />

            {/* Summary chips */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {distItems.map(item => (
                <div key={item.label} style={{
                  padding: '5px 12px', borderRadius: 20,
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}30`,
                  fontSize: 12, fontWeight: 600, color: item.color,
                }}>
                  {item.value} {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.52s both' }}>
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>🕐 Activité récente</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Dernières actions du système</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'aiPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11.5, color: '#10B981', fontWeight: 600 }}>Live</span>
            </div>
          </div>
          <div className="card-body" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <ActivityTimeline logs={logs} />
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.62s both' }}>
        <div className="card-header">
          <h3>⚡ Accès rapide</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 10, border: '1px solid var(--border)' }}>
            {quickActions.length} raccourcis
          </span>
        </div>
        <div className="card-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 10,
          }}>
            {quickActions.map((item, i) => (
              <QuickBtn key={item.label} {...item} index={i} navigate={navigate} />
            ))}
          </div>
        </div>
      </div>

      {/* ── SYSTEM OVERVIEW (dev only) ── */}
      {user?.role === 'developpeur' && (
        <div className="card" style={{ marginTop: 20, animation: 'cardEntrance 0.6s ease 0.72s both' }}>
          <div className="card-header">
            <h3>🖥️ Vue système</h3>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
              background: 'rgba(16,185,129,0.1)', color: '#10B981',
              border: '1px solid rgba(16,185,129,0.25)',
            }}>Opérationnel ✓</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>OCCUPATION DES RESSOURCES</p>
                <HealthBar label="Filières" value={stats.totalFilieres || 0} max={20} color="#F59E0B" delay={0} />
                <HealthBar label="Groupes"  value={stats.totalGroupes || 0}  max={50} color="#7C3AED" delay={100} />
                <HealthBar label="Modules"  value={stats.totalModules || 0}  max={100} color="#06D6A0" delay={200} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>UTILISATEURS ACTIFS</p>
                <HealthBar label="Professeurs" value={stats.totalProfs || 0}     max={stats.totalUsers || 1} color="#0EA5E9" delay={0} />
                <HealthBar label="Étudiants"   value={stats.totalEtudiants || 0} max={stats.totalUsers || 1} color="#10B981" delay={100} />
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <div style={{
                    padding: '8px 14px', borderRadius: 12,
                    background: 'rgba(6,214,160,0.08)',
                    border: '1px solid rgba(6,214,160,0.2)',
                    fontSize: 12, color: '#06D6A0', fontWeight: 600,
                  }}>
                    🚀 Backend: Railway
                  </div>
                  <div style={{
                    padding: '8px 14px', borderRadius: 12,
                    background: 'rgba(14,165,233,0.08)',
                    border: '1px solid rgba(14,165,233,0.2)',
                    fontSize: 12, color: '#0EA5E9', fontWeight: 600,
                  }}>
                    ⚡ API: Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
