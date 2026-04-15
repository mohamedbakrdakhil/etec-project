import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Filieres = () => {
  const [filieres, setFilieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nom: '', description: '', duree_mois: 24 });

  const fetch = useCallback(async () => {
    try { const res = await api.get('/filieres'); setFilieres(res.data); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditItem(null); setForm({ nom: '', description: '', duree_mois: 24 }); setShowModal(true); };
  const openEdit = (f) => { setEditItem(f); setForm({ nom: f.nom, description: f.description || '', duree_mois: f.duree_mois }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editItem) { await api.put(`/filieres/${editItem.id}`, { ...form, is_active: true }); }
      else { await api.post('/filieres', form); }
      setShowModal(false); fetch();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette filière ?')) return;
    try { await api.delete(`/filieres/${id}`); fetch(); } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Gestion des Filières</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvelle Filière</button>
      </div>

      <div className="stats-grid">
        {filieres.map(f => (
          <div key={f.id} className="card" style={{overflow: 'visible'}}>
            <div className="card-body">
              <div className="flex justify-between items-center mb-16">
                <h3 style={{fontSize: 16, fontWeight: 600}}>{f.nom}</h3>
                <div className="flex gap-8">
                  <button className="btn-icon edit" onClick={() => openEdit(f)}>✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(f.id)}>🗑️</button>
                </div>
              </div>
              <p className="text-sm text-muted" style={{marginBottom: 8}}>{f.description || 'Pas de description'}</p>
              <span className="badge badge-blue">{f.duree_mois} mois</span>
            </div>
          </div>
        ))}
      </div>

      {filieres.length === 0 && (
        <div className="empty-state">
          <div className="icon">🎓</div>
          <h3>Aucune filière</h3>
          <p>Commencez par créer une filière de formation.</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Modifier Filière' : 'Nouvelle Filière'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </>}
      >
        <div className="form-group">
          <label>Nom de la filière *</label>
          <input className="form-control" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Durée (mois)</label>
          <input type="number" className="form-control" value={form.duree_mois} onChange={e => setForm({...form, duree_mois: parseInt(e.target.value)})} />
        </div>
      </Modal>
    </div>
  );
};

export default Filieres;
