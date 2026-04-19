import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ProgressBar = ({ value, max = 20, color }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth((value / max) * 100), 200); }, [value, max]);
  return (
    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 4, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
};

const EtudiantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bulletin, setBulletin] = useState(null);
  const [absenceSummary, setAbsenceSummary] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/notes/bulletin'), api.get('/absences/summary')])
      .then(([b, a]) => {
        const bulletinData = b.data || {};
        if (!Array.isArray(bulletinData.modules)) bulletinData.modules = [];
        setBulletin(bulletinData);
        const absenceData = a.data || {};
        if (!Array.isArray(absenceData.summary)) absenceData.summary = [];
        setAbsenceSummary(absenceData);
      })
      .catch(console.error);
    setTimeout(() => setVisible(true), 100);
  }, []);

  const getNoteColor = (n) => n >= 14 ? '#10B981' : n >= 10 ? '#F59E0B' : '#EF4444';
  const getNoteGradient = (n) => n >= 14 ? 'linear-gradient(135deg,#10B981,#34D399)' : n >= 10 ? 'linear-gradient(135deg,#F59E0B,#FCD34D)' : 'linear-gradient(135deg,#EF4444,#F87171)';
  const getNoteLabel = (n) => n >= 14 ? '✅ Bien' : n >= 10 ? '⚠️ Passable' : '❌ Insuffisant';

  const moyG = bulletin?.moyenneGenerale;

  return (
    <div>
      <style>{`
        @keyframes slideDown { from { transform:translateY(-20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
        @keyframes slideUp { from { transform:translateY(20px);opacity:0; } to { transform:translateY(0);opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes popIn { from { transform:scale(0.8);opacity:0; } to { transform:scale(1);opacity:1; } }
      `}</style>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#051F2D,#0B4F6C,#2E8B57)',
        borderRadius: 24, padding: '28px 32px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
        animation: 'slideDown 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 20px 60px rgba(11,79,108,0.3)',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, background: 'rgba(46,139,87,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Espace Étudiant</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 4 }}>Bonjour, {user?.prenom} 👋</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Suivez vos notes et absences en temps réel</p>
          </div>
          {moyG !== undefined && moyG !== null && (
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '16px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', animation: 'popIn 0.6s ease 0.3s both' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: moyG >= 10 ? '#4ADE80' : '#FCA5A5', lineHeight: 1 }}>{moyG.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Moyenne générale / 20</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '📊', value: moyG ? `${moyG.toFixed(2)}/20` : '—', label: 'Moyenne générale', gradient: 'linear-gradient(135deg,#10B981,#34D399)', color: '#10B981' },
          { icon: '📚', value: bulletin?.modules?.length ?? 0, label: 'Modules', gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)', color: '#3B82F6' },
          { icon: '📅', value: absenceSummary?.totalAbsences ?? 0, label: 'Total absences', gradient: 'linear-gradient(135deg,#EF4444,#F87171)', color: '#EF4444' },
          { icon: '✅', value: (absenceSummary?.summary || []).reduce((a, s) => a + (s.justifiees || 0), 0), label: 'Justifiées', gradient: 'linear-gradient(135deg,#F59E0B,#FCD34D)', color: '#F59E0B' },
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
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Notes Bulletin */}
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(226,232,240,0.8)', marginBottom: 20, animation: 'slideUp 0.5s ease 0.3s both' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>📝 Bulletin de Notes</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {moyG && <span style={{ background: getNoteGradient(moyG), color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{moyG.toFixed(2)}/20</span>}
            <span onClick={() => navigate('/etudiant/notes')} style={{ fontSize: 12, color: '#0B4F6C', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Voir tout →</span>
          </div>
        </div>
        <div style={{ padding: '8px 0' }}>
          {!(bulletin?.modules?.length) ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <div>Aucune note disponible</div>
            </div>
          ) : (bulletin.modules || []).map((m, i) => (
            <div key={i} style={{ padding: '14px 22px', borderBottom: i < bulletin.modules.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{m.module_nom}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Coefficient: {m.coefficient}</div>
                </div>
                {m.moyenne !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: getNoteColor(m.moyenne) }}>{m.moyenne.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: getNoteColor(m.moyenne), fontWeight: 500 }}>{getNoteLabel(m.moyenne)}</div>
                  </div>
                )}
              </div>
              {m.moyenne !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ProgressBar value={m.moyenne} max={20} color={getNoteColor(m.moyenne)} />
                  <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>/20</span>
                </div>
              )}
              {(m.notes?.length > 0) && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {(m.notes || []).map((n, j) => (
                    <span key={j} style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: n.note >= 10 ? '#DCFCE7' : '#FEE2E2',
                      color: n.note >= 10 ? '#166534' : '#991B1B',
                    }}>
                      {n.type}: {n.note.toFixed(2)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Absences */}
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(226,232,240,0.8)', animation: 'slideUp 0.5s ease 0.4s both' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>📅 Mes Absences</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
              {absenceSummary?.totalAbsences ?? 0} absence(s)
            </span>
            <span onClick={() => navigate('/etudiant/absences')} style={{ fontSize: 12, color: '#0B4F6C', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Voir tout →</span>
          </div>
        </div>
        <div style={{ padding: '8px 0' }}>
          {!(absenceSummary?.summary?.length) ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div>Aucune absence enregistrée</div>
            </div>
          ) : (absenceSummary.summary || []).map((s, i) => (
            <div key={i} style={{ padding: '14px 22px', borderBottom: i < absenceSummary.summary.length - 1 ? '1px solid #F8FAFC' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{s.module_nom}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#F1F5F9', color: '#475569' }}>
                  Total: {s.total_absences}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#DCFCE7', color: '#166534' }}>
                  ✅ {s.justifiees}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#FEE2E2', color: '#991B1B' }}>
                  ❌ {s.non_justifiees}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EtudiantDashboard;
