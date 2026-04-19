import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Groupes = () => {
  const [groupes, setGroupes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nom: '', filiere_id: '', annee_scolaire: '2025-2026' });

  // Student management state
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [etudiantsGroupe, setEtudiantsGroupe] = useState([]);
  const [allEtudiants, setAllEtudiants] = useState([]);
  const [searchEtudiant, setSearchEtudiant] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const fetchGroupes = useCallback(async () => {
    try {
      const res = await api.get('/groupes');
      setGroupes(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchGroupes();
    api.get('/filieres').then(res => setFilieres(Array.isArray(res.data) ? res.data : [])).catch(console.error);
  }, [fetchGroupes]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ nom: '', filiere_id: filieres[0]?.id || '', annee_scolaire: '2025-2026' });
    setShowModal(true);
  };

  const openEdit = (g) => {
    setEditItem(g);
    setForm({ nom: g.nom, filiere_id: g.filiere_id, annee_scolaire: g.annee_scolaire });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) { await api.put(`/groupes/${editItem.id}`, form); }
      else { await api.post('/groupes', form); }
      setShowModal(false);
      fetchGroupes();
      if (selectedGroupe?.id === editItem?.id) {
        setSelectedGroupe({ ...selectedGroupe, ...form });
      }
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce groupe ?')) return;
    try {
      await api.delete(`/groupes/${id}`);
      fetchGroupes();
      if (selectedGroupe?.id === id) {
        setSelectedGroupe(null);
        setEtudiantsGroupe([]);
        setShowAddPanel(false);
      }
    } catch (err) { console.error(err); }
  };

  // --- Student panel ---
  const selectGroupe = async (g) => {
    setSelectedGroupe(g);
    setShowAddPanel(false);
    setSearchEtudiant('');
    setSelectedIds([]);
    setLoadingPanel(true);
    try {
      const res = await api.get(`/groupes/${g.id}/etudiants`);
      setEtudiantsGroupe(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setLoadingPanel(false);
  };

  const openAddPanel = async () => {
    setShowAddPanel(true);
    setSelectedIds([]);
    setSearchEtudiant('');
    try {
      const res = await api.get('/users?role=etudiant&limit=200');
      // API may return { users, total } or just array
      const data = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setAllEtudiants(data);
    } catch (err) { console.error(err); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddEtudiants = async () => {
    if (!selectedIds.length) return;
    try {
      await api.post(`/groupes/${selectedGroupe.id}/etudiants`, { etudiant_ids: selectedIds });
      const res = await api.get(`/groupes/${selectedGroupe.id}/etudiants`);
      setEtudiantsGroupe(Array.isArray(res.data) ? res.data : []);
      setShowAddPanel(false);
      setSelectedIds([]);
      fetchGroupes();
    } catch (err) { alert(err.response?.data?.message || 'Erreur lors de l\'ajout'); }
  };

  const handleRemoveEtudiant = async (etudiantId) => {
    if (!window.confirm('Retirer cet étudiant du groupe ?')) return;
    try {
      await api.delete(`/groupes/${selectedGroupe.id}/etudiants/${etudiantId}`);
      setEtudiantsGroupe(prev => prev.filter(e => e.id !== etudiantId));
      fetchGroupes();
    } catch (err) { alert(err.response?.data?.message || 'Erreur lors du retrait'); }
  };

  // Available students = all students not already in the group
  const etudiantIdsInGroupe = new Set(etudiantsGroupe.map(e => e.id));
  const availableEtudiants = allEtudiants.filter(e =>
    !etudiantIdsInGroupe.has(e.id) &&
    (`${e.prenom} ${e.nom}`.toLowerCase().includes(searchEtudiant.toLowerCase()) ||
     (e.cne || '').toLowerCase().includes(searchEtudiant.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <h2>Gestion des Groupes</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau Groupe</button>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Left: Groups table */}
        <div className="card" style={{ flex: selectedGroupe ? '0 0 55%' : '1' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Groupe</th>
                  <th>Filière</th>
                  <th>Année</th>
                  <th>Étudiants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: 30 }}>
                      Aucun groupe
                    </td>
                  </tr>
                ) : groupes.map(g => (
                  <tr
                    key={g.id}
                    style={{
                      cursor: 'pointer',
                      background: selectedGroupe?.id === g.id
                        ? 'rgba(6,214,160,0.07)'
                        : undefined,
                      borderLeft: selectedGroupe?.id === g.id
                        ? '3px solid var(--accent)'
                        : '3px solid transparent',
                    }}
                    onClick={() => selectGroupe(g)}
                  >
                    <td><strong>{g.nom}</strong></td>
                    <td><span className="badge badge-blue">{g.filiere_nom}</span></td>
                    <td>{g.annee_scolaire}</td>
                    <td>
                      <span className="badge badge-teal">{g.nb_etudiants} étud.</span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
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

        {/* Right: Student panel */}
        {selectedGroupe && (
          <div className="card" style={{ flex: 1, minWidth: 0 }}>
            {/* Panel header */}
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>👥 {selectedGroupe.nom}</h3>
                <p className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
                  {etudiantsGroupe.length} étudiant{etudiantsGroupe.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-8">
                {!showAddPanel && (
                  <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={openAddPanel}>
                    + Ajouter
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 13 }}
                  onClick={() => { setSelectedGroupe(null); setShowAddPanel(false); }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="card-body">
              {loadingPanel ? (
                <p className="text-muted text-center" style={{ padding: 20 }}>Chargement...</p>
              ) : showAddPanel ? (
                /* Add students sub-panel */
                <div>
                  <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                    <input
                      className="form-control"
                      placeholder="🔍 Chercher par nom ou CNE..."
                      value={searchEtudiant}
                      onChange={e => setSearchEtudiant(e.target.value)}
                      style={{ flex: 1 }}
                      autoFocus
                    />
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: 13 }}
                      onClick={() => { setShowAddPanel(false); setSelectedIds([]); }}
                    >
                      Annuler
                    </button>
                  </div>

                  {selectedIds.length > 0 && (
                    <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-teal">{selectedIds.length} sélectionné(s)</span>
                      <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={handleAddEtudiants}>
                        ✓ Ajouter au groupe
                      </button>
                    </div>
                  )}

                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {availableEtudiants.length === 0 ? (
                      <p className="text-muted text-center" style={{ padding: 20 }}>
                        {searchEtudiant ? 'Aucun résultat' : 'Tous les étudiants sont déjà dans ce groupe'}
                      </p>
                    ) : availableEtudiants.map(e => (
                      <label
                        key={e.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: selectedIds.includes(e.id)
                            ? 'rgba(6,214,160,0.08)'
                            : undefined,
                          marginBottom: 4,
                          transition: 'background 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(e.id)}
                          onChange={() => toggleSelect(e.id)}
                          style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {e.prenom} {e.nom}
                          </div>
                          {e.cne && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CNE: {e.cne}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                /* Current students list */
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {etudiantsGroupe.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
                      <p className="text-muted">Aucun étudiant dans ce groupe.</p>
                      <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={openAddPanel}>
                        + Ajouter des étudiants
                      </button>
                    </div>
                  ) : etudiantsGroupe.map(e => (
                    <div
                      key={e.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 8,
                        marginBottom: 4,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {e.prenom} {e.nom}
                        </div>
                        {e.cne && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CNE: {e.cne}</div>
                        )}
                      </div>
                      <button
                        className="btn-icon danger"
                        title="Retirer du groupe"
                        onClick={() => handleRemoveEtudiant(e.id)}
                        style={{ flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Modifier Groupe' : 'Nouveau Groupe'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
          </>
        }
      >
        <div className="form-group">
          <label>Nom du groupe *</label>
          <input
            className="form-control"
            placeholder="ex: DEV-101"
            value={form.nom}
            onChange={e => setForm({ ...form, nom: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Filière *</label>
          <select
            className="form-control"
            value={form.filiere_id}
            onChange={e => setForm({ ...form, filiere_id: e.target.value })}
          >
            <option value="">-- Choisir --</option>
            {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Année scolaire</label>
          <input
            className="form-control"
            placeholder="2025-2026"
            value={form.annee_scolaire}
            onChange={e => setForm({ ...form, annee_scolaire: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Groupes;
