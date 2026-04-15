import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Planning = ({ readOnly = false }) => {
  const [planning, setPlanning] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [modules, setModules] = useState([]);
  const [profs, setProfs] = useState([]);
  const [filterGroupe, setFilterGroupe] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ groupe_id: '', module_id: '', professeur_id: '', jour: 'lundi', heure_debut: '08:30', heure_fin: '11:00', salle: '' });

  const fetchPlanning = useCallback(async () => {
    try {
      const params = {};
      if (filterGroupe) params.groupe_id = filterGroupe;
      const res = await api.get('/planning', { params });
      setPlanning(res.data);
    } catch (err) { console.error(err); }
  }, [filterGroupe]);

  useEffect(() => {
    fetchPlanning();
    if (!readOnly) {
      api.get('/groupes').then(res => setGroupes(res.data)).catch(console.error);
      api.get('/modules').then(res => setModules(res.data)).catch(console.error);
      api.get('/users?role=professeur&limit=100').then(res => setProfs(res.data.users)).catch(console.error);
    }
  }, [fetchPlanning, readOnly]);

  const handleSave = async () => {
    try {
      await api.post('/planning', form);
      setShowModal(false); fetchPlanning();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette séance ?')) return;
    try { await api.delete(`/planning/${id}`); fetchPlanning(); } catch (err) { console.error(err); }
  };

  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const heures = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

  // Organiser par jour
  const planningByDay = {};
  jours.forEach(j => { planningByDay[j] = planning.filter(p => p.jour === j).sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)); });

  return (
    <div>
      <div className="page-header">
        <h2>{readOnly ? 'Mon Planning' : 'Gestion du Planning'}</h2>
        {!readOnly && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ajouter Séance</button>}
      </div>

      {!readOnly && (
        <div className="search-bar">
          <select className="form-control" style={{width: 'auto'}} value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
            <option value="">Tous les groupes</option>
            {groupes.map(g => <option key={g.id} value={g.id}>{g.nom} - {g.filiere_nom}</option>)}
          </select>
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{overflowX: 'auto'}}>
          <div style={{display: 'grid', gridTemplateColumns: `repeat(${jours.length}, minmax(160px, 1fr))`, gap: 8}}>
            {jours.map(j => (
              <div key={j}>
                <div style={{background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '8px 8px 0 0', textAlign: 'center', fontWeight: 600, fontSize: 13, textTransform: 'capitalize'}}>
                  {j}
                </div>
                <div style={{border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', minHeight: 200, padding: 6}}>
                  {planningByDay[j].length === 0 ? (
                    <p style={{textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 20}}>—</p>
                  ) : planningByDay[j].map(p => (
                    <div key={p.id} className="planning-item" style={{position: 'relative'}}>
                      <div className="module">{p.module_nom}</div>
                      <div className="prof">{p.prof_prenom} {p.prof_nom}</div>
                      <div style={{fontSize: 11, color: 'var(--text-light)'}}>{p.heure_debut?.slice(0,5)} - {p.heure_fin?.slice(0,5)}</div>
                      {p.salle && <div className="salle">📍 {p.salle}</div>}
                      {p.groupe_nom && <div style={{fontSize: 11, color: 'var(--text-muted)'}}>{p.groupe_nom}</div>}
                      {!readOnly && (
                        <button onClick={() => handleDelete(p.id)} style={{position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', opacity: 0.5}}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!readOnly && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajouter Séance"
          footer={<>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
          </>}
        >
          <div className="form-group">
            <label>Groupe *</label>
            <select className="form-control" value={form.groupe_id} onChange={e => setForm({...form, groupe_id: e.target.value})}>
              <option value="">-- Choisir --</option>
              {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Module *</label>
            <select className="form-control" value={form.module_id} onChange={e => setForm({...form, module_id: e.target.value})}>
              <option value="">-- Choisir --</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Professeur *</label>
            <select className="form-control" value={form.professeur_id} onChange={e => setForm({...form, professeur_id: e.target.value})}>
              <option value="">-- Choisir --</option>
              {profs.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Jour *</label>
            <select className="form-control" value={form.jour} onChange={e => setForm({...form, jour: e.target.value})}>
              {jours.map(j => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Heure début *</label>
              <select className="form-control" value={form.heure_debut} onChange={e => setForm({...form, heure_debut: e.target.value})}>
                {heures.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Heure fin *</label>
              <select className="form-control" value={form.heure_fin} onChange={e => setForm({...form, heure_fin: e.target.value})}>
                {heures.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Salle</label>
            <input className="form-control" placeholder="ex: Salle A1" value={form.salle} onChange={e => setForm({...form, salle: e.target.value})} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Planning;
