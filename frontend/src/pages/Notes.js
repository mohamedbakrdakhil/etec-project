import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterGroupe, setFilterGroupe] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ etudiant_id: '', module_id: '', type_note: 'controle1', note: '', observation: '' });

  const fetchNotes = useCallback(async () => {
    try {
      const params = {};
      if (filterGroupe) params.groupe_id = filterGroupe;
      if (filterModule) params.module_id = filterModule;
      const res = await api.get('/notes', { params });
      setNotes(res.data);
    } catch (err) { console.error(err); }
  }, [filterGroupe, filterModule]);

  useEffect(() => {
    fetchNotes();
    api.get('/groupes').then(res => setGroupes(res.data)).catch(console.error);
    api.get('/modules').then(res => setModules(res.data)).catch(console.error);
  }, [fetchNotes]);

  useEffect(() => {
    if (filterGroupe) {
      api.get(`/groupes/${filterGroupe}/etudiants`).then(res => setStudents(res.data)).catch(console.error);
    }
  }, [filterGroupe]);

  const openCreate = () => { setEditItem(null); setForm({ etudiant_id: '', module_id: '', type_note: 'controle1', note: '', observation: '' }); setShowModal(true); };
  const openEdit = (n) => { setEditItem(n); setForm({ etudiant_id: n.etudiant_id, module_id: n.module_id, type_note: n.type_note, note: n.note, observation: n.observation || '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editItem) { await api.put(`/notes/${editItem.id}`, { note: parseFloat(form.note), observation: form.observation }); }
      else { await api.post('/notes', { ...form, note: parseFloat(form.note) }); }
      setShowModal(false); fetchNotes();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette note ?')) return;
    try { await api.delete(`/notes/${id}`); fetchNotes(); } catch (err) { console.error(err); }
  };

  const getNoteClass = (note) => {
    if (note >= 14) return 'good';
    if (note >= 10) return 'warning';
    return 'bad';
  };

  const typeLabels = { controle1: 'Contrôle 1', controle2: 'Contrôle 2', controle3: 'Contrôle 3', examen_fin_module: 'EFM', tp: 'TP', projet: 'Projet' };

  return (
    <div>
      <div className="page-header">
        <h2>Gestion des Notes</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Ajouter Note</button>
      </div>

      <div className="search-bar">
        <select className="form-control" style={{width: 'auto'}} value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
          <option value="">Tous les groupes</option>
          {groupes.map(g => <option key={g.id} value={g.id}>{g.nom} - {g.filiere_nom}</option>)}
        </select>
        <select className="form-control" style={{width: 'auto'}} value={filterModule} onChange={e => setFilterModule(e.target.value)}>
          <option value="">Tous les modules</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Module</th>
                <th>Type</th>
                <th>Note</th>
                <th>Observation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted" style={{padding: 30}}>Aucune note</td></tr>
              ) : notes.map(n => (
                <tr key={n.id}>
                  <td><strong>{n.etudiant_nom} {n.etudiant_prenom}</strong></td>
                  <td>{n.module_nom}</td>
                  <td><span className="badge badge-gray">{typeLabels[n.type_note] || n.type_note}</span></td>
                  <td><span className={`note-value ${getNoteClass(n.note)}`}>{parseFloat(n.note).toFixed(2)}/20</span></td>
                  <td className="text-sm text-muted">{n.observation || '—'}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn-icon edit" onClick={() => openEdit(n)}>✏️</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(n.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Modifier Note' : 'Ajouter Note'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </>}
      >
        {!editItem && (
          <>
            <div className="form-group">
              <label>Groupe (pour filtrer les étudiants)</label>
              <select className="form-control" value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
                <option value="">-- Choisir un groupe --</option>
                {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Étudiant *</label>
              <select className="form-control" value={form.etudiant_id} onChange={e => setForm({...form, etudiant_id: e.target.value})}>
                <option value="">-- Choisir --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
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
              <label>Type de note *</label>
              <select className="form-control" value={form.type_note} onChange={e => setForm({...form, type_note: e.target.value})}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </>
        )}
        <div className="form-row">
          <div className="form-group">
            <label>Note /20 *</label>
            <input type="number" min="0" max="20" step="0.25" className="form-control" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>Observation</label>
          <textarea className="form-control" rows="2" value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} />
        </div>
      </Modal>
    </div>
  );
};

export default Notes;
