import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nom: '', code: '', coefficient: 1.0, filiere_id: '' });
  const [filterFiliere, setFilterFiliere] = useState('');

  const fetchModules = useCallback(async () => {
    try {
      const params = filterFiliere ? { filiere_id: filterFiliere } : {};
      const res = await api.get('/modules', { params });
      setModules(res.data);
    } catch (err) { console.error(err); }
  }, [filterFiliere]);

  useEffect(() => {
    fetchModules();
    api.get('/filieres').then(res => setFilieres(res.data)).catch(console.error);
  }, [fetchModules]);

  const openCreate = () => { setEditItem(null); setForm({ nom: '', code: '', coefficient: 1.0, filiere_id: filieres[0]?.id || '' }); setShowModal(true); };
  const openEdit = (m) => { setEditItem(m); setForm({ nom: m.nom, code: m.code || '', coefficient: m.coefficient, filiere_id: m.filiere_id }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editItem) { await api.put(`/modules/${editItem.id}`, form); }
      else { await api.post('/modules', form); }
      setShowModal(false); fetchModules();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce module ?')) return;
    try { await api.delete(`/modules/${id}`); fetchModules(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Gestion des Modules</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau Module</button>
      </div>

      <div className="search-bar">
        <select className="form-control" style={{width: 'auto'}} value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)}>
          <option value="">Toutes les filières</option>
          {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Module</th>
                <th>Filière</th>
                <th>Coefficient</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted" style={{padding: 30}}>Aucun module</td></tr>
              ) : modules.map(m => (
                <tr key={m.id}>
                  <td><span className="badge badge-gray">{m.code || '—'}</span></td>
                  <td><strong>{m.nom}</strong></td>
                  <td>{m.filiere_nom}</td>
                  <td>{m.coefficient}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn-icon edit" onClick={() => openEdit(m)}>✏️</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(m.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Modifier Module' : 'Nouveau Module'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Code</label>
            <input className="form-control" placeholder="ex: M101" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Coefficient</label>
            <input type="number" step="0.5" className="form-control" value={form.coefficient} onChange={e => setForm({...form, coefficient: parseFloat(e.target.value)})} />
          </div>
        </div>
        <div className="form-group">
          <label>Nom du module *</label>
          <input className="form-control" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Filière *</label>
          <select className="form-control" value={form.filiere_id} onChange={e => setForm({...form, filiere_id: e.target.value})}>
            <option value="">-- Choisir --</option>
            {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Modules;
