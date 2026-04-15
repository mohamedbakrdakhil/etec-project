import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Enseignements = () => {
  const [enseignements, setEnseignements] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [modules, setModules] = useState([]);
  const [profs, setProfs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ professeur_id: '', module_id: '', groupe_id: '', annee_scolaire: '2025-2026' });

  const fetch = useCallback(async () => {
    try { const res = await api.get('/enseignements'); setEnseignements(res.data); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetch();
    api.get('/groupes').then(res => setGroupes(res.data)).catch(console.error);
    api.get('/modules').then(res => setModules(res.data)).catch(console.error);
    api.get('/users?role=professeur&limit=100').then(res => setProfs(res.data.users)).catch(console.error);
  }, [fetch]);

  const handleSave = async () => {
    try { await api.post('/enseignements', form); setShowModal(false); fetch(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette affectation ?')) return;
    try { await api.delete(`/enseignements/${id}`); fetch(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Affectation des Enseignements</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Affecter</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Professeur</th><th>Module</th><th>Groupe</th><th>Filière</th><th>Année</th><th>Actions</th></tr></thead>
            <tbody>
              {enseignements.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted" style={{padding: 30}}>Aucune affectation</td></tr>
              ) : enseignements.map(e => (
                <tr key={e.id}>
                  <td><strong>{e.prof_nom} {e.prof_prenom}</strong></td>
                  <td>{e.module_nom}</td>
                  <td><span className="badge badge-blue">{e.groupe_nom}</span></td>
                  <td>{e.filiere_nom}</td>
                  <td>{e.annee_scolaire}</td>
                  <td><button className="btn-icon danger" onClick={() => handleDelete(e.id)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Affecter Enseignement"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </>}
      >
        <div className="form-group">
          <label>Professeur *</label>
          <select className="form-control" value={form.professeur_id} onChange={e => setForm({...form, professeur_id: e.target.value})}>
            <option value="">-- Choisir --</option>
            {profs.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Module *</label>
          <select className="form-control" value={form.module_id} onChange={e => setForm({...form, module_id: e.target.value})}>
            <option value="">-- Choisir --</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.filiere_nom})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Groupe *</label>
          <select className="form-control" value={form.groupe_id} onChange={e => setForm({...form, groupe_id: e.target.value})}>
            <option value="">-- Choisir --</option>
            {groupes.map(g => <option key={g.id} value={g.id}>{g.nom} - {g.filiere_nom}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Année scolaire</label>
          <input className="form-control" value={form.annee_scolaire} onChange={e => setForm({...form, annee_scolaire: e.target.value})} />
        </div>
      </Modal>
    </div>
  );
};

export default Enseignements;
