import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ETECHero from '../components/ETECHero';

const ProfDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [planning, setPlanning] = useState([]);

  useEffect(() => {
    api.get('/planning')
      .then(r => setPlanning(Array.isArray(r.data) ? r.data : []))
      .catch(console.error);
  }, []);

  const today = new Date();
  const jourActuel = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][today.getDay()];
  const coursAujourdhui = (planning || []).filter(p => p.jour === jourActuel);

  const stats = [
    { icon: '📚', value: planning.length,       label: 'Séances / semaine', color: '#0EA5E9' },
    { icon: '📅', value: coursAujourdhui.length, label: "Cours aujourd'hui", color: '#10B981' },
    { icon: '👨‍🎓', value: '—',                   label: 'Étudiants',         color: '#7C3AED' },
  ];

  return (
    <div>
      {/* ── ETEC HERO ── */}
      <ETECHero user={user} subtitle="Espace Professeur — gérez vos cours, notes et absences" />

      {/* ── STAT CARDS ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 100} />
        ))}
      </div>

      {/* ── COURS AUJOURD'HUI ── */}
      <div className="card mb-24" style={{ animation: 'cardEntrance 0.6s ease 0.4s both' }}>
        <div className="card-header">
          <h3>📅 Cours d'aujourd'hui <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({jourActuel})</span></h3>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: coursAujourdhui.length ? 'rgba(6,214,160,0.12)' : 'var(--surface-2)',
            color: coursAujourdhui.length ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${coursAujourdhui.length ? 'rgba(6,214,160,0.3)' : 'var(--border)'}`,
          }}>
            {coursAujourdhui.length} cours
          </span>
        </div>
        <div className="card-body">
          {coursAujourdhui.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>☕</div>
              <p>Aucun cours prévu aujourd'hui.</p>
            </div>
          ) : coursAujourdhui.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '10px 0',
              borderBottom: i < coursAujourdhui.length - 1 ? '1px solid var(--border)' : 'none',
              animation: `cardEntrance 0.4s ease ${0.5 + i * 0.07}s both`,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>📖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.module_nom}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {c.heure_debut?.slice(0,5)} – {c.heure_fin?.slice(0,5)}
                  {c.groupe_nom && <span> · {c.groupe_nom}</span>}
                  {c.salle && <span> · 📍 {c.salle}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="card" style={{ animation: 'cardEntrance 0.6s ease 0.55s both' }}>
        <div className="card-header"><h3>⚡ Mes outils</h3></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: '📝', label: 'Saisie Notes',    path: '/prof/notes',    color: '#10B981' },
            { icon: '📅', label: 'Saisie Absences', path: '/prof/absences', color: '#F59E0B' },
            { icon: '🗓️', label: 'Mon Planning',    path: '/prof/planning', color: '#0EA5E9' },
          ].map((item, i) => (
            <QuickBtn key={item.label} {...item} delay={i * 80} onClick={() => navigate(item.path)} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Stat card ── */
const StatCard = ({ icon, value, label, color, delay }) => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay + 200); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${color}10` : 'var(--surface)',
        border: `1.5px solid ${hovered ? color : 'var(--border)'}`,
        borderRadius: 18, padding: '20px 18px',
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0)') : 'translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: hovered ? `0 12px 30px ${color}30` : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14, marginBottom: 12,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        animation: hovered ? 'iconBounce 0.4s ease' : `iconFloat 3s ease-in-out infinite`,
        animationDelay: `${delay / 3000}s`,
      }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: hovered ? color : 'var(--text)', lineHeight: 1, marginBottom: 5, transition: 'color 0.3s' }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
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
        borderRadius: 14, padding: '14px 10px',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
        boxShadow: hovered ? `0 6px 20px ${color}30` : 'none',
        animation: `cardEntrance 0.5s ease ${0.6 + delay / 1000}s both`,
      }}
    >
      <span style={{ fontSize: 26, animation: hovered ? 'iconBounce 0.4s ease' : 'none' }}>{icon}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: hovered ? color : 'var(--text)' }}>{label}</span>
    </button>
  );
};

export default ProfDashboard;
