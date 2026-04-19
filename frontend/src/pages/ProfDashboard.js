import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ProfDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [planning, setPlanning] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api.get('/planning')
      .then(r => setPlanning(Array.isArray(r.data) ? r.data : []))
      .catch(console.error);
    setTimeout(() => setVisible(true), 100);
  }, []);

  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const jourActuel = jours[new Date().getDay()];
  const coursAujourdhui = (planning || []).filter(p => p.jour === jourActuel).sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));
  const demain = jours[(new Date().getDay() + 1) % 7];
  const coursDemain = (planning || []).filter(p => p.jour === demain);

  const timeToMinutes = (t) => { if (!t) return 0; const [h, m] = t.split(':'); return parseInt(h) * 60 + parseInt(m); };
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const getCourseStatus = (p) => {
    const start = timeToMinutes(p.heure_debut);
    const end = timeToMinutes(p.heure_fin);
    if (nowMinutes >= start && nowMinutes <= end && p.jour === jourActuel) return 'en-cours';
    if (p.jour === jourActuel && nowMinutes < start) return 'a-venir';
    return 'passe';
  };

  const getStatusStyle = (status) => ({
    'en-cours': { border: '2px solid #10B981', background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', badge: { bg: '#10B981', text: '🟢 En cours' } },
    'a-venir': { border: '1px solid #DBEAFE', background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', badge: { bg: '#3B82F6', text: '⏳ À venir' } },
    'passe': { border: '1px solid #F1F5F9', background: '#FAFBFC', badge: null },
  }[status]);

  const jours_semaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const coursParJour = jours_semaine.map(j => ({ jour: j, nb: (planning || []).filter(p => p.jour === j).length }));

  return (
    <div>
      <style>{`
        @keyframes slideDown { from { transform:translateY(-20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
        @keyframes slideUp { from { transform:translateY(20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#051F2D,#0B4F6C,#1A6B8A)',
        borderRadius: 24, padding: '28px 32px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
        animation: 'slideDown 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 20px 60px rgba(11,79,108,0.3)',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4 }}>Bonjour, Prof. {user?.nom} 👨‍🏫</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Votre espace enseignant — ETEC Fès</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '📚', value: planning.length, label: 'Séances/semaine', gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)', color: '#3B82F6' },
          { icon: '📅', value: coursAujourdhui.length, label: `Cours aujourd'hui`, gradient: 'linear-gradient(135deg,#10B981,#34D399)', color: '#10B981' },
          { icon: '⏭️', value: coursDemain.length, label: 'Cours demain', gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)', color: '#8B5CF6' },
          { icon: '📍', value: [...new Set((planning || []).map(p => p.salle).filter(Boolean))].length, label: 'Salles', gradient: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#F59E0B' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 18, padding: '20px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid rgba(226,232,240,0.8)',
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            opacity: visible ? 1 : 0,
            transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 80}ms`,
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `0 6px 16px ${s.color}30`, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>

        {/* Cours du jour */}
        <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(226,232,240,0.8)', animation: 'slideUp 0.5s ease 0.3s both' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
              📅 Cours d'aujourd'hui
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 400, marginLeft: 8, textTransform: 'capitalize' }}>({jourActuel})</span>
            </h3>
            {coursAujourdhui.length > 0 && (
              <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {coursAujourdhui.length} cours
              </span>
            )}
          </div>
          <div style={{ padding: 16 }}>
            {coursAujourdhui.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94A3B8' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                <div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>Pas de cours aujourd'hui !</div>
                <div style={{ fontSize: 13 }}>Profitez de votre journée</div>
              </div>
            ) : coursAujourdhui.map((c, i) => {
              const status = getCourseStatus(c);
              const st = getStatusStyle(status);
              return (
                <div key={i} style={{
                  padding: '14px 16px', borderRadius: 14, marginBottom: 10,
                  background: st.background, border: st.border,
                  transition: 'all 0.2s ease',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {status === 'en-cours' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: '#10B981', borderRadius: '14px 0 0 14px' }} />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ paddingLeft: status === 'en-cours' ? 8 : 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{c.module_nom}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        🕐 {c.heure_debut?.slice(0,5)} - {c.heure_fin?.slice(0,5)}
                        {c.groupe_nom && <span style={{ marginLeft: 8 }}>👥 {c.groupe_nom}</span>}
                      </div>
                      {c.salle && <div style={{ fontSize: 12, color: '#2E8B57', marginTop: 3, fontWeight: 500 }}>📍 {c.salle}</div>}
                    </div>
                    {st.badge && (
                      <span style={{ background: st.badge.bg, color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', animation: status === 'en-cours' ? 'pulse 2s infinite' : 'none' }}>
                        {st.badge.text}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Répartition semaine + actions rapides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Semaine */}
          <div style={{ background: 'white', borderRadius: 20, padding: 22, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(226,232,240,0.8)', animation: 'slideUp 0.5s ease 0.4s both' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>📊 Semaine</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {coursParJour.map(({ jour, nb }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 70, fontSize: 12, fontWeight: jour === jourActuel ? 700 : 400, color: jour === jourActuel ? '#0B4F6C' : '#64748B', textTransform: 'capitalize' }}>{jour}</div>
                  <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(nb / Math.max(...coursParJour.map(c => c.nb), 1)) * 100}%`, background: jour === jourActuel ? 'linear-gradient(90deg,#0B4F6C,#2E8B57)' : 'linear-gradient(90deg,#BFDBFE,#93C5FD)', borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', width: 20, textAlign: 'right' }}>{nb}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ background: 'white', borderRadius: 20, padding: 22, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(226,232,240,0.8)', animation: 'slideUp 0.5s ease 0.5s both' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>🚀 Actions</h3>
            {[
              { icon: '📝', label: 'Saisir les notes', desc: 'Entrer les résultats', color: '#10B981', bg: '#ECFDF5', path: '/prof/notes' },
              { icon: '📅', label: 'Faire l\'appel', desc: 'Enregistrer les absences', color: '#EF4444', bg: '#FEF2F2', path: '/prof/absences' },
              { icon: '🕐', label: 'Mon planning', desc: 'Voir mon emploi du temps', color: '#8B5CF6', bg: '#F5F3FF', path: '/prof/planning' },
            ].map((a, i) => (
              <div key={i} onClick={() => navigate(a.path)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, marginBottom: 8, background: a.bg, cursor: 'pointer', transition: 'all 0.2s ease', border: `1px solid ${a.color}18` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${a.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: a.color }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{a.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: a.color, fontSize: 16 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfDashboard;
