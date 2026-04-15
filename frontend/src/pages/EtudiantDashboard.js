import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EtudiantDashboard = () => {
  const { user } = useAuth();
  const [bulletin, setBulletin] = useState(null);
  const [absenceSummary, setAbsenceSummary] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [bulRes, absRes] = await Promise.all([
          api.get('/notes/bulletin'),
          api.get('/absences/summary')
        ]);
        setBulletin(bulRes.data);
        setAbsenceSummary(absRes.data);
      } catch (err) { console.error(err); }
    };
    fetch();
  }, []);

  const getNoteClass = (note) => {
    if (note >= 14) return 'good';
    if (note >= 10) return 'warning';
    return 'bad';
  };

  return (
    <div>
      <div className="page-header">
        <h2>Mon Espace</h2>
        <span className="badge badge-green">Étudiant</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">📊</div>
          <div className="stat-info">
            <h4>{bulletin?.moyenneGenerale ?? '—'}</h4>
            <p>Moyenne Générale</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div className="stat-info">
            <h4>{bulletin?.modules?.length ?? 0}</h4>
            <p>Modules</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">📅</div>
          <div className="stat-info">
            <h4>{absenceSummary?.totalAbsences ?? 0}</h4>
            <p>Total Absences</p>
          </div>
        </div>
      </div>

      {/* Bulletin */}
      <div className="card mb-24">
        <div className="card-header">
          <h3>📝 Mes Notes - Bulletin</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Coefficient</th>
                <th>Notes</th>
                <th>Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {bulletin?.modules?.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-muted" style={{padding: 30}}>Aucune note disponible</td></tr>
              ) : bulletin?.modules?.map((m, i) => (
                <tr key={i}>
                  <td><strong>{m.module_nom}</strong></td>
                  <td>{m.coefficient}</td>
                  <td>
                    <div className="flex gap-8" style={{flexWrap: 'wrap'}}>
                      {m.notes.map((n, j) => (
                        <span key={j} className={`badge ${n.note >= 10 ? 'badge-green' : 'badge-red'}`}>
                          {n.type}: {n.note.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {m.moyenne !== null
                      ? <span className={`note-value ${getNoteClass(m.moyenne)}`}>{m.moyenne.toFixed(2)}/20</span>
                      : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bulletin?.moyenneGenerale && (
          <div style={{padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)'}}>
            <strong>Moyenne Générale: <span className={`note-value ${getNoteClass(bulletin.moyenneGenerale)}`}>{bulletin.moyenneGenerale.toFixed(2)}/20</span></strong>
          </div>
        )}
      </div>

      {/* Absences */}
      <div className="card">
        <div className="card-header">
          <h3>📅 Mes Absences</h3>
          <span className="badge badge-red">{absenceSummary?.totalAbsences ?? 0} absence(s)</span>
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
              {absenceSummary?.summary?.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-muted" style={{padding: 30}}>Aucune absence</td></tr>
              ) : absenceSummary?.summary?.map((s, i) => (
                <tr key={i}>
                  <td><strong>{s.module_nom}</strong></td>
                  <td><strong>{s.total_absences}</strong></td>
                  <td><span className="badge badge-green">{s.justifiees}</span></td>
                  <td><span className="badge badge-red">{s.non_justifiees}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EtudiantDashboard;
