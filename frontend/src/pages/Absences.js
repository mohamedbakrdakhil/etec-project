import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Absences = () => {
  const [absences, setAbsences] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterGroupe, setFilterGroupe] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [form, setForm] = useState({ etudiant_id: '', module_id: '', date_absence: '', seance: 's1', motif: '' });
  const [bulkForm, setBulkForm] = useState({ module_id: '', date_absence: '', seance: 's1', absents: [] });

  const fetchAbsences = useCallback(async () => {
    try {
      const params = {};
      if (filterGroupe) params.groupe_id = filterGroupe;
      const res = await api.get('/absences', { params });
      setAbsences(res.data);
    } catch (err) { console.error(err); }
  }, [filterGroupe]);

  useEffect(() => {
    fetchAbsences();
    api.get('/groupes').then(res => setGroupes(res.data)).catch(console.error);
    api.get('/modules').then(res => setModules(res.data)).catch(console.error);
  }, [fetchAbsences]);

  useEffect(() => {
    if (filterGroupe) {
      api.get(`/groupes/${filterGroupe}/etudiants`).then(res => setStudents(res.data)).catch(console.error);
    }
  }, [filterGroupe]);

  const handleAdd = async () => {
    try {
      await api.post('/absences', form);
      setShowModal(false); fetchAbsences();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleBulkAdd = async () => {
    try {
      await api.post('/absences/bulk', bulkForm);
      setShowBulkModal(false); fetchAbsences();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleJustify = async (id) => {
    const motif = prompt('Motif de justification:');
    if (motif === null) return;
    try { await api.put(`/absences/${id}/justify`, { motif }); fetchAbsences(); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette absence ?')) return;
    try { await api.delete(`/absences/${id}`); fetchAbsences(); } catch (err) { console.error(err); }
  };

  const toggleBulkStudent = (id) => {
    setBulkForm(prev => ({
      ...prev,
      absents: prev.absents.includes(id) ? prev.absents.filter(x => x !== id) : [...prev.absents, id]
    }));
  };

  const seanceLabels = { s1: 'Séance 1', s2: 'Séance 2', s3: 'Séance 3', s4: 'Séance 4' };

  return (
    <div>
      <div className="page-header">
        <h2>Gestion des Absences</h2>
        <div className="flex gap-8">
          <button className="btn btn-outline" onClick={() => { setBulkForm({ module_id: '', date_absence: new Date().toISOString().split('T')[0], seance: 's1', absents: [] }); setShowBulkModal(true); }}>📋 Appel de groupe</button>
          <button className="btn btn-primary" onClick={() => { setForm({ etudiant_id: '', module_id: '', date_absence: new Date().toISOString().split('T')[0], seance: 's1', motif: '' }); setShowModal(true); }}>+ Ajouter</button>
        </div>
      </div>

      <div className="search-bar">
        <select className="form-control" style={{width: 'auto'}} value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
          <option value="">Tous les groupes</option>
          {groupes.map(g => <option key={g.id} value={g.id}>{g.nom} - {g.filiere_nom}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{absences.length} absence(s)</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Module</th>
                <th>Date</th>
                <th>Séance</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {absences.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted" style={{padding: 30}}>Aucune absence</td></tr>
              ) : absences.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.etudiant_nom} {a.etudiant_prenom}</strong></td>
                  <td>{a.module_nom}</td>
                  <td>{new Date(a.date_absence).toLocaleDateString('fr-FR')}</td>
                  <td>{seanceLabels[a.seance]}</td>
                  <td>
                    {a.justifiee
                      ? <span className="badge badge-green">Justifiée</span>
                      : <span className="badge badge-red">Non justifiée</span>
                    }
                  </td>
                  <td>
                    <div className="flex gap-8">
                      {!a.justifiee && <button className="btn-icon edit" onClick={() => handleJustify(a.id)} title="Justifier">✅</button>}
                      <button className="btn-icon danger" onClick={() => handleDelete(a.id)} title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajout individuel */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajouter Absence"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleAdd}>Enregistrer</button>
        </>}
      >
        <div className="form-group">
          <label>Groupe</label>
          <select className="form-control" value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
            <option value="">-- Choisir --</option>
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
        <div className="form-row">
          <div className="form-group">
            <label>Date *</label>
            <input type="date" className="form-control" value={form.date_absence} onChange={e => setForm({...form, date_absence: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Séance *</label>
            <select className="form-control" value={form.seance} onChange={e => setForm({...form, seance: e.target.value})}>
              {Object.entries(seanceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal appel en masse */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Appel de Groupe"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowBulkModal(false)}>Annuler</button>
          <button className="btn btn-danger" onClick={handleBulkAdd}>{bulkForm.absents.length} absent(s) - Enregistrer</button>
        </>}
      >
        <div className="form-group">
          <label>Groupe *</label>
          <select className="form-control" value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
            <option value="">-- Choisir --</option>
            {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Module *</label>
            <select className="form-control" value={bulkForm.module_id} onChange={e => setBulkForm({...bulkForm, module_id: e.target.value})}>
              <option value="">-- Choisir --</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input type="date" className="form-control" value={bulkForm.date_absence} onChange={e => setBulkForm({...bulkForm, date_absence: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>Séance *</label>
          <select className="form-control" value={bulkForm.seance} onChange={e => setBulkForm({...bulkForm, seance: e.target.value})}>
            {Object.entries(seanceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Cocher les absents:</label>
          <div style={{maxHeight: 250, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8}}>
            {students.map(s => (
              <label key={s.id} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer'}}>
                <input type="checkbox" checked={bulkForm.absents.includes(s.id)} onChange={() => toggleBulkStudent(s.id)} style={{width: 18, height: 18, accentColor: 'var(--danger)'}} />
                <span>{s.nom} {s.prenom}</span>
              </label>
            ))}
            {students.length === 0 && <p className="text-muted text-sm">Sélectionnez un groupe</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Absences;
