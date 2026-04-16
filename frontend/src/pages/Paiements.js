import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';

const Paiements = () => {
  const [summary, setSummary] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [search, setSearch] = useState('');
  const [groupeFilter, setGroupeFilter] = useState('');
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editPaiement, setEditPaiement] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    montant: '',
    date_paiement: new Date().toISOString().split('T')[0],
    type_paiement: 'mensualite',
    mois: '',
    methode: 'especes',
    observation: '',
  });

  const fetchSummary = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (groupeFilter) params.groupe_id = groupeFilter;
      const res = await api.get('/paiements/summary', { params });
      setSummary(res.data);
    } catch (err) { console.error(err); }
  }, [search, groupeFilter]);

  const fetchPaiementsEtudiant = useCallback(async (etudiantId) => {
    try {
      const res = await api.get(`/paiements/etudiant/${etudiantId}`);
      setPaiements(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => {
    api.get('/groupes').then(r => setGroupes(r.data)).catch(console.error);
  }, []);

  const selectEtudiant = (etudiant) => {
    setSelectedEtudiant(etudiant);
    fetchPaiementsEtudiant(etudiant.id);
  };

  const openAdd = () => {
    setEditPaiement(null);
    setForm({
      montant: '',
      date_paiement: new Date().toISOString().split('T')[0],
      type_paiement: 'mensualite',
      mois: '',
      methode: 'especes',
      observation: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditPaiement(p);
    setForm({
      montant: p.montant,
      date_paiement: p.date_paiement?.split('T')[0] || p.date_paiement,
      type_paiement: p.type_paiement,
      mois: p.mois || '',
      methode: p.methode,
      observation: p.observation || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editPaiement) {
        await api.put(`/paiements/${editPaiement.id}`, form);
      } else {
        await api.post('/paiements', { ...form, etudiant_id: selectedEtudiant.id });
      }
      setShowModal(false);
      fetchPaiementsEtudiant(selectedEtudiant.id);
      fetchSummary();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce paiement ?')) return;
    try {
      await api.delete(`/paiements/${id}`);
      fetchPaiementsEtudiant(selectedEtudiant.id);
      fetchSummary();
    } catch (err) { console.error(err); }
  };

  const getMethodeBadge = (m) => {
    const cfg = {
      especes: { cls: 'badge-green', label: '💵 Espèces' },
      virement: { cls: 'badge-blue', label: '🏦 Virement' },
      cheque: { cls: 'badge-orange', label: '📄 Chèque' },
    };
    const c = cfg[m] || { cls: 'badge-gray', label: m };
    return <span className={`badge ${c.cls}`}>{c.label}</span>;
  };

  const getTypeBadge = (t) => {
    const cfg = {
      inscription: { cls: 'badge-red', label: 'Inscription' },
      mensualite: { cls: 'badge-blue', label: 'Mensualité' },
      autre: { cls: 'badge-gray', label: 'Autre' },
    };
    const c = cfg[t] || { cls: 'badge-gray', label: t };
    return <span className={`badge ${c.cls}`}>{c.label}</span>;
  };

  const totalGeneral = summary.reduce((acc, e) => acc + parseFloat(e.total_paye || 0), 0);
  const totalPaiementsEtudiant = paiements.reduce((acc, p) => acc + parseFloat(p.montant || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>💳 Gestion des Paiements</h2>
        <div style={{ fontSize: 14, color: 'var(--text-light)', fontWeight: 600 }}>
          Total encaissé: <span style={{ color: 'var(--green)', fontSize: 18 }}>{totalGeneral.toFixed(2)} DH</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedEtudiant ? '1fr 1.4fr' : '1fr', gap: 20 }}>

        {/* LEFT: liste étudiants */}
        <div>
          <div className="search-bar">
            <div className="search-input">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Rechercher étudiant..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-control" style={{ width: 'auto' }} value={groupeFilter} onChange={e => setGroupeFilter(e.target.value)}>
              <option value="">Tous les groupes</option>
              {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Étudiants ({summary.length})</h3>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Groupe</th>
                    <th>Total payé</th>
                    <th>Paiements</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted" style={{ padding: 30 }}>Aucun étudiant</td></tr>
                  ) : summary.map(e => (
                    <tr
                      key={e.id}
                      onClick={() => selectEtudiant(e)}
                      style={{
                        cursor: 'pointer',
                        background: selectedEtudiant?.id === e.id ? 'rgba(11,79,108,0.06)' : '',
                        borderLeft: selectedEtudiant?.id === e.id ? '3px solid var(--primary)' : '3px solid transparent',
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{e.nom} {e.prenom}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.cin || '—'}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{e.groupe_nom || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: parseFloat(e.total_paye) > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                          {parseFloat(e.total_paye).toFixed(2)} DH
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue">{e.nb_paiements}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: détail paiements étudiant */}
        {selectedEtudiant && (
          <div>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>
                    {selectedEtudiant.nom} {selectedEtudiant.prenom}
                    <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
                      {selectedEtudiant.cin || ''}
                    </span>
                  </h3>
                  <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>
                    Total: {totalPaiementsEtudiant.toFixed(2)} DH · {paiements.length} paiement(s)
                  </div>
                </div>
                <div className="flex gap-8">
                  <button className="btn btn-primary" onClick={openAdd}>+ Ajouter</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedEtudiant(null)}>✕</button>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Type</th>
                      <th>Mois</th>
                      <th>Méthode</th>
                      <th>Saisi par</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.length === 0 ? (
                      <tr><td colSpan="7" className="text-center text-muted" style={{ padding: 30 }}>
                        <div className="empty-state">
                          <span className="icon">💳</span>
                          <h3>Aucun paiement</h3>
                          <p>Cliquez sur "+ Ajouter" pour enregistrer un paiement</p>
                        </div>
                      </td></tr>
                    ) : paiements.map(p => (
                      <tr key={p.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(p.date_paiement).toLocaleDateString('fr-MA')}
                        </td>
                        <td>
                          <strong style={{ color: 'var(--green)' }}>{parseFloat(p.montant).toFixed(2)} DH</strong>
                        </td>
                        <td>{getTypeBadge(p.type_paiement)}</td>
                        <td style={{ fontSize: 13 }}>{p.mois || '—'}</td>
                        <td>{getMethodeBadge(p.methode)}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {p.saisi_par_prenom} {p.saisi_par_nom}
                        </td>
                        <td>
                          <div className="flex gap-8">
                            <button className="btn-icon edit" onClick={() => openEdit(p)} title="Modifier">✏️</button>
                            <button className="btn-icon danger" onClick={() => handleDelete(p.id)} title="Supprimer">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!selectedEtudiant && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
            👆 Cliquez sur un étudiant pour voir ses paiements
          </div>
        )}
      </div>

      {/* Modal ajout/modification */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editPaiement ? 'Modifier Paiement' : `+ Paiement — ${selectedEtudiant?.nom} ${selectedEtudiant?.prenom}`}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-green" onClick={handleSave}>Enregistrer</button>
        </>}
      >
        {error && <div className="login-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label>Montant (DH) *</label>
            <input type="number" className="form-control" min="0" step="0.01"
              placeholder="ex: 500" value={form.montant}
              onChange={e => setForm({ ...form, montant: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input type="date" className="form-control" value={form.date_paiement}
              onChange={e => setForm({ ...form, date_paiement: e.target.value })} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select className="form-control" value={form.type_paiement}
              onChange={e => setForm({ ...form, type_paiement: e.target.value })}>
              <option value="mensualite">Mensualité</option>
              <option value="inscription">Inscription</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Méthode</label>
            <select className="form-control" value={form.methode}
              onChange={e => setForm({ ...form, methode: e.target.value })}>
              <option value="especes">💵 Espèces</option>
              <option value="virement">🏦 Virement</option>
              <option value="cheque">📄 Chèque</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Mois concerné</label>
          <input className="form-control" placeholder="ex: Octobre 2024"
            value={form.mois} onChange={e => setForm({ ...form, mois: e.target.value })} />
        </div>

        <div className="form-group">
          <label>Observation</label>
          <textarea className="form-control" rows="2" placeholder="Remarque optionnelle..."
            value={form.observation} onChange={e => setForm({ ...form, observation: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
};

export default Paiements;
