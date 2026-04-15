import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const EtudiantAbsences = () => {
  const [summary, setSummary] = useState(null);
  const [absences, setAbsences] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/absences/summary'),
      api.get('/absences')
    ]).then(([sumRes, absRes]) => {
      setSummary(sumRes.data);
      setAbsences(absRes.data);
    }).catch(console.error);
  }, []);

  const seanceLabels = { s1: 'Séance 1', s2: 'Séance 2', s3: 'Séance 3', s4: 'Séance 4' };

  return (
    <div>
      <div className="page-header">
        <h2>Mes Absences</h2>
        <span className="badge badge-red" style={{fontSize: 14, padding: '6px 16px'}}>
          {summary?.totalAbsences ?? 0} absence(s)
        </span>
      </div>

      {/* Résumé par module */}
      <div className="card mb-24">
        <div className="card-header"><h3>Résumé par Module</h3></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Module</th><th>Total</th><th>Justifiées</th><th>Non justifiées</th></tr></thead>
            <tbody>
              {summary?.summary?.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-muted" style={{padding: 30}}>Aucune absence</td></tr>
              ) : summary?.summary?.map((s, i) => (
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

      {/* Détail */}
      <div className="card">
        <div className="card-header"><h3>Détail des Absences</h3></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Module</th><th>Séance</th><th>Statut</th><th>Motif</th></tr></thead>
            <tbody>
              {absences.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted" style={{padding: 30}}>Aucune absence</td></tr>
              ) : absences.map(a => (
                <tr key={a.id}>
                  <td>{new Date(a.date_absence).toLocaleDateString('fr-FR')}</td>
                  <td>{a.module_nom}</td>
                  <td>{seanceLabels[a.seance]}</td>
                  <td>{a.justifiee ? <span className="badge badge-green">Justifiée</span> : <span className="badge badge-red">Non justifiée</span>}</td>
                  <td className="text-sm text-muted">{a.motif || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EtudiantAbsences;
