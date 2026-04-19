import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Groupes = () => {
  const [groupes, setGroupes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nom: '', filiere_id: '', annee_scolaire: '2025-2026' });
  const [error, setError] = useState('');

  // Gestion des étudiants
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [etudiantsGroupe, setEtudiantsGroupe] = useState([]);
  const [allEtudiants, setAllEtudiants] = useState([]);
  const [loadingEtudiants, setLoadingEtudiants] = useState(false);
  const [searchAjout, setSearchAjout] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [savingMsg, setSavingMsg] = useState('');

  const fetchGroupes = useCallback(async () => {
    try {
      const res = await api.get('/groupes');
      setGroupes(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchGroupes();
    api.get('/filieres').then(r => setFilieres(r.data)).catch(console.error);
  }, [fetchGroupes]);

  // Quand on sélectionne un groupe → charger ses étudiants
  const selectGroupe = useCallback(async (groupe) => {
    setSelectedGroupe(groupe);
    setShowAddPanel(false);
    setSelectedToAdd([]);
    setSearchAjout('');
    setLoadingEtudiants(true);
    try {
      const [studentsRes, allRes] = await Promise.all([
        api.get(`/groupes/${groupe.id}/etudiants`),
        api.get('/users', { params: { role: 'etudiant', limit: 200 } }),
      ]);
      setEtudiantsGroupe(studentsRes.data);
      const users = allRes.data.users || allRes.data;
      setAllEtudiants(Array.isArray(users) ? users : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEtudiants(false);
    }
  }, []);

  // Retirer un étudiant du groupe
  const handleRemoveEtudiant = async (etudiantId) => {
    if (!window.confirm('Retirer cet étudiant du groupe ?')) return;
    try {
      await api.delete(`/groupes/${selectedGroupe.id}/etudiants/${etudiantId}`);
      setEtudiantsGroupe(prev => prev.filter(e => e.id !== etudiantId));
      fetchGroupes();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur serveur');
    }
  };

  // Ajouter les étudiants sélectionnés
  const handleAddEtudiants = async () => {
    if (selectedToAdd.length === 0) return;
    setSavingMsg('Ajout en cours...');
    try {
      await api.post(`/groupes/${selectedGroupe.id}/etudiants`, { etudiant_ids: selectedToAdd });
      setSavingMsg('');
      setShowAddPanel(false);
      setSelectedToAdd([]);
      await selectGroupe(selectedGroupe);
      fetchGroupes();
    } catch (err) {
      setSavingMsg('');
      alert(err.response?.data?.message || 'Erreur serveur');
    }
  };

  // Étudiants non encore dans ce groupe
  const etudiantsDanGroupe = new Set(etudiantsGroupe.map(e => e.id));
  const etudiantsDisponibles = allEtudiants.filter(e =>
    !etudiantsDanGroupe.has(e.id) &&
    (`${e.prenom} ${e.nom}`.toLowerCase().includes(searchAjout.toLowerCase()) ||
      (e.cin || '').toLowerCase().includes(searchAjout.toLowerCase()) ||
      (e.email || '').toLowerCase().includes(searchAjout.toLowerCase()))
  );

  const toggleSelect = (id) => {
    setSelectedToAdd(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Modal groupe
  const openCreate = () => {
    setEditItem(null);
    setForm({ nom: '', filiere_id: filieres[0]?.id || '', annee_scolaire: '2025-2026' });
    setError('');
    setShowModal(true);
  };
  const openEdit = (g, e) => {
    e.stopPropagation();
    setEditItem(g);
    setForm({ nom: g.nom, filiere_id: g.filiere_id, annee_scolaire: g.annee_scolaire });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.nom.trim() || !form.filiere_id) {
      setError('Nom et filière sont obligatoires.');
      return;
    }
    try {
      if (editItem) { await api.put(`/groupes/${editItem.id}`, form); }
      else { await api.post('/groupes', form); }
      setShowModal(false);
      fetchGroupes();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur.');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer ce groupe et tous ses liens ?')) return;
    try {
      await api.delete(`/groupes/${id}`);
      if (selectedGroupe?.id === id) setSelectedGroupe(null);
      fetchGroupes();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>📋 Gestion des Groupes</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau Groupe</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedGroupe ? '1fr 1.5fr' : '1fr', gap: 20 }}>

        {/* ===== LISTE DES GROUPES ===== */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', background: '#FAFBFF' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Tous les groupes ({groupes.length})
            </h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
              Cliquez sur un groupe pour gérer ses étudiants
            </p>
          </div>
          <div>
            {groupes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div>Aucun groupe créé</div>
              </div>
            ) : groupes.map(g => (
              <div key={g.id}
                onClick={() => selectGroupe(g)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', cursor: 'pointer',
                  borderBottom: '1px solid #F8FAFC',
                  background: selectedGroupe?.id === g.id ? 'linear-gradient(90deg,#EFF6FF,#F0FDF4)' : 'white',
                  borderLeft: selectedGroupe?.id === g.id ? '4px solid #0B4F6C' : '4px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (selectedGroupe?.id !== g.id) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (selectedGroupe?.id !== g.id) e.currentTarget.style.background = 'white'; }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{g.nom}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    <span className="badge badge-blue" style={{ fontSize: 11, marginRight: 6 }}>{g.filiere_nom}</span>
                    {g.annee_scolaire}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: g.nb_etudiants > 0 ? '#DCFCE7' : '#F1F5F9',
                    color: g.nb_etudiants > 0 ? '#166534' : '#64748B',
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700
                  }}>
                    👥 {g.nb_etudiants}
                  </span>
                  <button className="btn-icon edit" onClick={(e) => openEdit(g, e)} title="Modifier">✏️</button>
                  <button className="btn-icon danger" onClick={(e) => handleDelete(g.id, e)} title="Supprimer">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== PANEL ÉTUDIANTS DU GROUPE ===== */}
        {selectedGroupe && (
          <div className="card" style={{ padding: '18px 22px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  👥 {selectedGroupe.nom}
                </h3>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  <span className="badge badge-blue" style={{ marginRight: 6 }}>{selectedGroupe.filiere_nom}</span>
                  {selectedGroupe.annee_scolaire} · {etudiantsGroupe.length} étudiant(s) inscrit(s)
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={showAddPanel ? 'btn btn-outline' : 'btn btn-primary'}
                  onClick={() => { setShowAddPanel(!showAddPanel); setSelectedToAdd([]); setSearchAjout(''); }}
                >
                  {showAddPanel ? '✖ Annuler' : '➕ Ajouter étudiants'}
                </button>
                <button className="btn btn-outline" onClick={() => { setSelectedGroupe(null); setShowAddPanel(false); }}>✖</button>
              </div>
            </div>

            {/* Panel ajout */}
            {showAddPanel && (
              <div style={{ background: '#F0F7FF', borderRadius: 12, padding: 16, border: '1px solid #BFDBFE', marginBottom: 18 }}>
                <div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: 12, fontSize: 14 }}>
                  ➕ Sélectionner les étudiants à ajouter
                </div>
                <input
                  className="form-control"
                  placeholder="🔍 Rechercher par nom, CIN ou email..."
                  value={searchAjout}
                  onChange={e => setSearchAjout(e.target.value)}
                  style={{ marginBottom: 10 }}
                  autoFocus
                />
                <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #DBEAFE', borderRadius: 10, background: 'white' }}>
                  {etudiantsDisponibles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 28, color: '#94A3B8' }}>
                      {allEtudiants.length === 0
                        ? '⚠️ Aucun étudiant dans le système. Créez d\'abord des comptes étudiants.'
                        : searchAjout
                          ? 'Aucun résultat pour cette recherche'
                          : '✅ Tous les étudiants sont déjà dans ce groupe'}
                    </div>
                  ) : etudiantsDisponibles.map(e => (
                    <div key={e.id}
                      onClick={() => toggleSelect(e.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px', cursor: 'pointer',
                        background: selectedToAdd.includes(e.id) ? '#EFF6FF' : 'white',
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={ev => { if (!selectedToAdd.includes(e.id)) ev.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={ev => { if (!selectedToAdd.includes(e.id)) ev.currentTarget.style.background = 'white'; }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                        border: selectedToAdd.includes(e.id) ? '2px solid #0B4F6C' : '2px solid #CBD5E1',
                        background: selectedToAdd.includes(e.id) ? '#0B4F6C' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {selectedToAdd.includes(e.id) && <span style={{ color: 'white', fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                      </div>
                      {/* Avatar */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0B4F6C,#2E8B57)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {(e.prenom?.[0] || '').toUpperCase()}{(e.nom?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{e.prenom} {e.nom}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{e.cin ? `CIN: ${e.cin}` : e.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                    {selectedToAdd.length > 0
                      ? `${selectedToAdd.length} étudiant(s) sélectionné(s)`
                      : 'Cochez les étudiants à ajouter'}
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddEtudiants}
                    disabled={selectedToAdd.length === 0 || !!savingMsg}
                    style={{ opacity: selectedToAdd.length === 0 ? 0.5 : 1 }}
                  >
                    {savingMsg || `✅ Ajouter (${selectedToAdd.length})`}
                  </button>
                </div>
              </div>
            )}

            {/* Liste étudiants actuels */}
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 12, fontSize: 14 }}>
              Étudiants inscrits ({etudiantsGroupe.length})
            </div>
            {loadingEtudiants ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8' }}>
                <div style={{ width: 30, height: 30, border: '3px solid #E2E8F0', borderTopColor: '#0B4F6C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                Chargement...
              </div>
            ) : etudiantsGroupe.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: '#94A3B8', background: '#F8FAFC', borderRadius: 12, border: '2px dashed #E2E8F0' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>👤</div>
                <div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>Aucun étudiant dans ce groupe</div>
                <div style={{ fontSize: 13 }}>Cliquez sur "➕ Ajouter étudiants" pour inscrire des étudiants</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {etudiantsGroupe.map(e => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', background: '#FAFBFF', borderRadius: 10,
                    border: '1px solid #EEF2FF', animation: 'fadeIn 0.3s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#0B4F6C,#2E8B57)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {(e.prenom?.[0] || '').toUpperCase()}{(e.nom?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{e.prenom} {e.nom}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{e.cin ? `CIN: ${e.cin}` : e.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveEtudiant(e.id)}
                      style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: '#DC2626', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
                      onMouseEnter={ev => ev.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={ev => ev.currentTarget.style.background = '#FEF2F2'}
                    >
                      ✖ Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal create/edit groupe */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Modifier le Groupe' : 'Nouveau Groupe'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </>}
      >
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}
        <div className="form-group">
          <label>Nom du groupe *</label>
          <input className="form-control" placeholder="ex: DEV-101" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Filière *</label>
          <select className="form-control" value={form.filiere_id} onChange={e => setForm({ ...form, filiere_id: e.target.value })}>
            <option value="">-- Choisir une filière --</option>
            {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Année scolaire</label>
          <input className="form-control" placeholder="2025-2026" value={form.annee_scolaire} onChange={e => setForm({ ...form, annee_scolaire: e.target.value })} />
        </div>
      </Modal>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default Groupes;
