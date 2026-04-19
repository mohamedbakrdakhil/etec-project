import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const useCounter = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const StatCard = ({ icon, value, label, gradient, color, delay = 0 }) => {
  const count = useCounter(value);
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      style={{
        background: 'white', borderRadius: 20, padding: '22px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        border: '1px solid rgba(226,232,240,0.8)',
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        opacity: visible ? 1 : 0,
        transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
        position: 'relative', overflow: 'hidden', cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${color}25`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
    >
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: gradient, borderRadius: '50%', opacity: 0.07 }} />
      <div style={{ width: 52, height: 52, borderRadius: 14, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: `0 8px 20px ${color}30`, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{count}</div>
        <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Bonjour');

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 12 && h < 18) setGreeting('Bon après-midi');
    else if (h >= 18) setGreeting('Bonsoir');
  }, []);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(console.error);
    if (user?.role === 'developpeur') {
      api.get('/dashboard/logs?limit=6').then(r => setLogs(r.data.logs || [])).catch(console.error);
    }
  }, [user]);

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: '4px solid #E2E8F0', borderTopColor: '#0B4F6C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 14 }}>Chargement...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const cards = [
    { icon: '👥', value: stats.totalUsers, label: 'Utilisateurs', color: '#0B4F6C', gradient: 'linear-gradient(135deg,#0B4F6C,#1A6B8A)', delay: 0 },
    { icon: '👨‍🏫', value: stats.totalProfs, label: 'Professeurs', color: '#3B82F6', gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)', delay: 80 },
    { icon: '🎒', value: stats.totalEtudiants, label: 'Étudiants', color: '#10B981', gradient: 'linear-gradient(135deg,#10B981,#34D399)', delay: 160 },
    { icon: '🎓', value: stats.totalFilieres, label: 'Filières', color: '#F59E0B', gradient: 'linear-gradient(135deg,#F59E0B,#FCD34D)', delay: 240 },
    { icon: '📋', value: stats.totalGroupes, label: 'Groupes', color: '#EF4444', gradient: 'linear-gradient(135deg,#EF4444,#F87171)', delay: 320 },
    { icon: '📚', value: stats.totalModules, label: 'Modules', color: '#8B5CF6', gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)', delay: 400 },
  ];

  const dateStr = new Date().toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes blink { 0%,100% { opacity:1; box-shadow:0 0 0 3px rgba(74,222,128,0.25); } 50% { opacity:0.5; box-shadow:0 0 0 6px rgba(74,222,128,0.1); } }
      `}</style>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #051F2D 0%, #0B4F6C 45%, #1A6B8A 75%, #2E8B57 100%)',
        borderRadius: 24, padding: '28px 32px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
        animation: 'slideDown 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 20px 60px rgba(11,79,108,0.3)',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 80, width: 180, height: 180, background: 'rgba(46,139,87,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: 20, right: 180, width: 60, height: 60, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'capitalize' }}>{dateStr}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 6 }}>
            {greeting}, {user?.prenom} ! 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 18 }}>
            Système de gestion scolaire — ETEC Fès
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', padding: '7px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <span style={{ width: 8, height: 8, background: '#4ADE80', borderRadius: '50%', animation: 'blink 2s infinite', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500 }}>
              {user?.role === 'developpeur' ? '⚙️ Mode Développeur' : '🏫 Administration'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: logs.length ? '1fr 1fr' : '1fr', gap: 18 }}>

        <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(226,232,240,0.8)', animation: 'slideUp 0.5s ease 0.4s both' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: '#0F172A' }}>⚡ Accès Rapide</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '👥', label: 'Utilisateurs', color: '#0B4F6C', bg: '#EFF6FF' },
              { icon: '📝', label: 'Notes', color: '#10B981', bg: '#ECFDF5' },
              { icon: '📅', label: 'Absences', color: '#EF4444', bg: '#FEF2F2' },
              { icon: '🕐', label: 'Planning', color: '#8B5CF6', bg: '#F5F3FF' },
              { icon: '🎓', label: 'Filières', color: '#F59E0B', bg: '#FFFBEB' },
              { icon: '💳', label: 'Paiements', color: '#2E8B57', bg: '#F0FDF4' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: item.bg, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s ease', border: `1px solid ${item.color}18` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = `0 6px 16px ${item.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {logs.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(226,232,240,0.8)', animation: 'slideUp 0.5s ease 0.5s both' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: '#0F172A' }}>🔍 Activité Récente</h3>
            {logs.slice(0, 6).map((log, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < logs.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#0B4F6C,#2E8B57)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {log.action === 'Connexion' ? '🔐' : log.action?.includes('paiement') ? '💳' : log.action?.includes('Création') ? '👤' : '📋'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.user_prenom} {log.user_nom}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{log.action}</div>
                </div>
                <div style={{ fontSize: 11, color: '#CBD5E1', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
