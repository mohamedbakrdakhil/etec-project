import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Groupes = () => {
  const [groupes, setGroupes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nom: '', filiere_id: '', annee_scolaire: '2025-2026' });

  const fetchGroupes = useCallback(async () => {
    try { const res = await api.get('/groupes'); setGroupes(res.data); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchGroupes();
    api.get('/filieres').then(res => setFilieres(res.data)).catch(console.error);
  }, [fetchGroupes]);

  const openCreate = () => { setEditItem(null); setForm({ nom: '', filiere_id: filieres[0]?.id || '', annee_scolaire: '2025-2026' }); setShowModal(true); };
  const openEdit = (g) => { setEditItem(g); setForm({ nom: g.nom, filiere_id: g.filiere_id, annee_scolaire: g.annee_scolaire }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editItem) { await api.put(`/groupes/${editItem.id}`, form); }
      else { await api.post('/groupes', form); }
      setShowModal(false); fetchGroupes();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce groupe ?')) return;
    try { await api.delete(`/groupes/${id}`); fetchGroupes(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Gestion des Groupes</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau Groupe</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Groupe</th>
                <th>Filière</th>
                <th>Année scolaire</th>
                <th>Étudiants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupes.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted" style={{padding: 30}}>Aucun groupe</td></tr>
              ) : groupes.map(g => (
                <tr key={g.id}>
                  <td><strong>{g.nom}</strong></td>
                  <td><span className="badge badge-blue">{g.filiere_nom}</span></td>
                  <td>{g.annee_scolaire}</td>
                  <td><strong>{g.nb_etudiants}</strong></td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn-icon edit" onClick={() => openEdit(g)}>✏️</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(g.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Modifier Groupe' : 'Nouveau Groupe'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </>}
      >
        <div className="form-group">
          <label>Nom du groupe *</label>
          <input className="form-control" placeholder="ex: DEV-101" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Filière *</label>
          <select className="form-control" value={form.filiere_id} onChange={e => setForm({...form, filiere_id: e.target.value})}>
            <option value="">-- Choisir --</option>
            {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Année scolaire</label>
          <input className="form-control" placeholder="2025-2026" value={form.annee_scolaire} onChange={e => setForm({...form, annee_scolaire: e.target.value})} />
        </div>
      </Modal>
    </div>
  );
};

export default Groupes;
