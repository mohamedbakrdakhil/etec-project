import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Annonces = ({ readOnly = false }) => {
  const [annonces, setAnnonces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titre: '', contenu: '', cible: 'tous' });

  const fetch = useCallback(async () => {
    try { const res = await api.get('/annonces'); setAnnonces(res.data); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async () => {
    try { await api.post('/annonces', form); setShowModal(false); fetch(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try { await api.delete(`/annonces/${id}`); fetch(); } catch (err) { console.error(err); }
  };

  const cibleBadge = { tous: 'badge-blue', professeurs: 'badge-orange', etudiants: 'badge-green' };

  return (
    <div>
      <div className="page-header">
        <h2>Annonces</h2>
        {!readOnly && <button className="btn btn-primary" onClick={() => { setForm({ titre: '', contenu: '', cible: 'tous' }); setShowModal(true); }}>+ Publier</button>}
      </div>

      {annonces.length === 0 ? (
        <div className="empty-state"><div className="icon">📢</div><h3>Aucune annonce</h3></div>
      ) : annonces.map(a => (
        <div key={a.id} className="card" style={{marginBottom: 12}}>
          <div className="card-header">
            <div>
              <h3>{a.titre}</h3>
              <span className="text-sm text-muted">{a.publie_prenom} {a.publie_nom} • {new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex gap-8 items-center">
              <span className={`badge ${cibleBadge[a.cible]}`}>{a.cible}</span>
              {!readOnly && <button className="btn-icon danger" onClick={() => handleDelete(a.id)}>🗑️</button>}
            </div>
          </div>
          <div className="card-body">
            <p style={{whiteSpace: 'pre-wrap'}}>{a.contenu}</p>
          </div>
        </div>
      ))}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle Annonce"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Publier</button>
        </>}
      >
        <div className="form-group">
          <label>Titre *</label>
          <input className="form-control" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Contenu *</label>
          <textarea className="form-control" rows="5" value={form.contenu} onChange={e => setForm({...form, contenu: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Cible</label>
          <select className="form-control" value={form.cible} onChange={e => setForm({...form, cible: e.target.value})}>
            <option value="tous">Tout le monde</option>
            <option value="professeurs">Professeurs</option>
            <option value="etudiants">Étudiants</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Annonces;
