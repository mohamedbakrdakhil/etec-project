import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const EtudiantNotes = () => {
  const [bulletin, setBulletin] = useState(null);

  useEffect(() => {
    api.get('/notes/bulletin').then(res => setBulletin(res.data)).catch(console.error);
  }, []);

  const getNoteClass = (note) => {
    if (note >= 14) return 'good';
    if (note >= 10) return 'warning';
    return 'bad';
  };

  const typeLabels = { controle1: 'CC1', controle2: 'CC2', controle3: 'CC3', examen_fin_module: 'EFM', tp: 'TP', projet: 'Projet' };

  if (!bulletin) return <div className="text-center text-muted" style={{padding: 40}}>Chargement...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Mes Notes</h2>
        {bulletin.moyenneGenerale && (
          <span className={`badge ${bulletin.moyenneGenerale >= 10 ? 'badge-green' : 'badge-red'}`} style={{fontSize: 16, padding: '6px 16px'}}>
            Moyenne: {bulletin.moyenneGenerale.toFixed(2)}/20
          </span>
        )}
      </div>

      {bulletin.modules.length === 0 ? (
        <div className="empty-state"><div className="icon">📝</div><h3>Aucune note</h3><p>Vos notes apparaîtront ici.</p></div>
      ) : bulletin.modules.map((m, i) => (
        <div key={i} className="card" style={{marginBottom: 12}}>
          <div className="card-header">
            <div>
              <h3>{m.module_nom}</h3>
              <span className="text-sm text-muted">Coefficient: {m.coefficient}</span>
            </div>
            {m.moyenne !== null && (
              <span className={`note-value ${getNoteClass(m.moyenne)}`} style={{fontSize: 20}}>
                {m.moyenne.toFixed(2)}/20
              </span>
            )}
          </div>
          <div className="card-body">
            <div className="flex gap-12" style={{flexWrap: 'wrap'}}>
              {m.notes.map((n, j) => (
                <div key={j} style={{background: 'var(--bg)', padding: '10px 16px', borderRadius: 8, textAlign: 'center', minWidth: 80}}>
                  <div className="text-sm text-muted">{typeLabels[n.type] || n.type}</div>
                  <div className={`note-value ${getNoteClass(n.note)}`} style={{fontSize: 18, marginTop: 4}}>{n.note.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EtudiantNotes;
