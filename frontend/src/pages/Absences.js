import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

// Derive séance from start hour
const getSeance = (heure) => {
  const h = parseInt((heure || '08').split(':')[0]);
  if (h < 10) return 's1';
  if (h < 12) return 's2';
  if (h < 16) return 's3';
  return 's4';
};

const SEANCE_LABELS = { s1: 'Séance 1 (matin)', s2: 'Séance 2 (matin)', s3: 'Séance 3 (après-midi)', s4: 'Séance 4 (après-midi)' };

/* ================================================================
   PROFESSOR VIEW — planning-first workflow
   ================================================================ */
const ProfAbsenceView = () => {
  const [planning, setPlanning] = useState([]);
  const [selectedSeance, setSelectedSeance] = useState(null);
  const [students, setStudents] = useState([]);
  const [absents, setAbsents] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [existingAbsences, setExistingAbsences] = useState([]);

  const today = new Date();
  const jourAujourdhui = JOURS[today.getDay()];
  const dateAujourdhui = today.toISOString().split('T')[0];

  useEffect(() => {
    api.get('/planning')
      .then(r => setPlanning(Array.isArray(r.data) ? r.data : []))
      .catch(console.error);
  }, []);

  const coursAujourdhui = planning.filter(p => p.jour === jourAujourdhui);
  const coursAffiches = showAll ? planning : coursAujourdhui;

  const selectSeance = async (seance) => {
    setSelectedSeance(seance);
    setSaved(false);
    setAbsents(new Set());
    try {
      const [studRes, absRes] = await Promise.all([
        api.get(`/groupes/${seance.groupe_id}/etudiants`),
        api.get('/absences', { params: { groupe_id: seance.groupe_id, module_id: seance.module_id } }),
      ]);
      setStudents(Array.isArray(studRes.data) ? studRes.data : []);
      setExistingAbsences(Array.isArray(absRes.data) ? absRes.data : []);
    } catch (err) { console.error(err); }
  };

  const toggleAbsent = (id) => {
    setAbsents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleEnregistrer = async () => {
    if (!selectedSeance) return;
    setSaving(true);
    try {
      await api.post('/absences/bulk', {
        module_id: selectedSeance.module_id,
        groupe_id: selectedSeance.groupe_id,
        date_absence: dateAujourdhui,
        seance: getSeance(selectedSeance.heure_debut),
        absents: [...absents],
      });
      setSaved(true);
      setAbsents(new Set());
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
    setSaving(false);
  };

  const alreadyDone = (seance) => {
    return existingAbsences.some(a =>
      a.module_id === seance.module_id &&
      a.date_absence?.startsWith(dateAujourdhui) &&
      a.seance === getSeance(seance.heure_debut)
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>📅 Saisie des Absences</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedSeance ? '340px 1fr' : '1fr', gap: 20, alignItems: 'flex-start' }}>

        {/* ── LEFT: Planning sessions ── */}
        <div>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>🗓️ {showAll ? 'Tout le planning' : `Aujourd'hui — ${jourAujourdhui}`}</h3>
              <button
                className="btn btn-outline"
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={() => setShowAll(v => !v)}
              >
                {showAll ? 'Aujourd\'hui' : 'Voir tout'}
              </button>
            </div>
            <div className="card-body" style={{ padding: '8px 12px' }}>
              {coursAffiches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>☕</div>
                  <p style={{ fontSize: 13 }}>Aucun cours {showAll ? '' : 'aujourd\'hui'}.</p>
                  {!showAll && (
                    <button className="btn btn-outline" style={{ marginTop: 8, fontSize: 12 }} onClick={() => setShowAll(true)}>
                      Voir tout le planning
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {coursAffiches.map(c => {
                    const isSelected = selectedSeance?.id === c.id;
                    const isDone = alreadyDone(c);
                    return (
                      <div
                        key={c.id}
                        onClick={() => !isDone && selectSeance(c)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 14,
                          border: `2px solid ${isSelected ? 'var(--accent)' : isDone ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                          background: isSelected
                            ? 'rgba(6,214,160,0.08)'
                            : isDone
                            ? 'rgba(16,185,129,0.05)'
                            : 'var(--surface-2)',
                          cursor: isDone ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: isDone ? 0.75 : 1,
                          position: 'relative',
                        }}
                      >
                        {/* Day badge (shown in "all" view) */}
                        {showAll && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                            color: c.jour === jourAujourdhui ? 'var(--accent)' : 'var(--text-muted)',
                            letterSpacing: 0.5,
                          }}>
                            {c.jour}
                          </span>
                        )}
                        <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? 'var(--accent)' : 'var(--text)', marginTop: showAll ? 2 : 0 }}>
                          {c.module_nom}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span>🕐 {c.heure_debut?.slice(0,5)} – {c.heure_fin?.slice(0,5)}</span>
                          <span>👥 {c.groupe_nom}</span>
                          {c.salle && <span>📍 {c.salle}</span>}
                        </div>
                        {isDone && (
                          <span style={{
                            position: 'absolute', top: 8, right: 10,
                            fontSize: 11, fontWeight: 700, color: '#10B981',
                            background: 'rgba(16,185,129,0.1)', borderRadius: 10, padding: '1px 7px',
                          }}>✓ Appel fait</span>
                        )}
                        {isSelected && !isDone && (
                          <span style={{
                            position: 'absolute', top: 8, right: 10,
                            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                            background: 'rgba(6,214,160,0.1)', borderRadius: 10, padding: '1px 7px',
                          }}>▶ Sélectionné</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Attendance list ── */}
        {selectedSeance && (
          <div className="card" style={{ animation: 'cardEntrance 0.35s ease both' }}>
            {/* Session header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(6,214,160,0.08), rgba(124,58,237,0.05))',
              borderBottom: '1px solid var(--border)',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{selectedSeance.module_nom}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 14 }}>
                    <span>🕐 {selectedSeance.heure_debut?.slice(0,5)} – {selectedSeance.heure_fin?.slice(0,5)}</span>
                    <span>👥 {selectedSeance.groupe_nom}</span>
                    <span>📅 {today.toLocaleDateString('fr-FR')}</span>
                    {selectedSeance.salle && <span>📍 {selectedSeance.salle}</span>}
                  </div>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 12 }}
                  onClick={() => setSelectedSeance(null)}
                >✕</button>
              </div>

              {/* Summary bar */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: 'rgba(16,185,129,0.12)', color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}>
                  ✓ {students.length - absents.size} présents
                </span>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: absents.size > 0 ? 'rgba(239,68,68,0.12)' : 'var(--surface-2)',
                  color: absents.size > 0 ? '#EF4444' : 'var(--text-muted)',
                  border: `1px solid ${absents.size > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                }}>
                  ✗ {absents.size} absents
                </span>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12,
                  background: 'var(--surface-2)', color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}>
                  {students.length} étudiants total
                </span>
              </div>
            </div>

            {/* Student list */}
            <div style={{ padding: '12px 16px' }}>
              {students.length === 0 ? (
                <p className="text-muted text-center" style={{ padding: 20 }}>Aucun étudiant dans ce groupe.</p>
              ) : (
                <>
                  {/* Select all / none */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button
                      style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text)' }}
                      onClick={() => setAbsents(new Set())}
                    >✓ Tous présents</button>
                    <button
                      style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', color: '#EF4444' }}
                      onClick={() => setAbsents(new Set(students.map(s => s.id)))}
                    >✗ Tous absents</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
                    {students.map((s, i) => {
                      const isAbsent = absents.has(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleAbsent(s.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                            border: `1.5px solid ${isAbsent ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.25)'}`,
                            background: isAbsent ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.04)',
                            transition: 'all 0.18s',
                            animation: `cardEntrance 0.3s ease ${i * 0.03}s both`,
                          }}
                        >
                          {/* Status indicator */}
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: isAbsent ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            border: `2px solid ${isAbsent ? '#EF4444' : '#10B981'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, fontWeight: 700,
                            color: isAbsent ? '#EF4444' : '#10B981',
                            transition: 'all 0.2s',
                          }}>
                            {isAbsent ? '✗' : '✓'}
                          </div>

                          {/* Name */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {s.prenom} {s.nom}
                            </div>
                            {s.cne && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CNE: {s.cne}</div>}
                          </div>

                          {/* Badge */}
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                            background: isAbsent ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                            color: isAbsent ? '#EF4444' : '#10B981',
                          }}>
                            {isAbsent ? 'Absent' : 'Présent'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Save button */}
                  <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                    {saved ? (
                      <div style={{
                        flex: 1, padding: '12px 20px', borderRadius: 12, textAlign: 'center',
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                        color: '#10B981', fontWeight: 700, fontSize: 14,
                      }}>
                        ✅ Appel enregistré avec succès !
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '12px', fontSize: 14, borderRadius: 12 }}
                        onClick={handleEnregistrer}
                        disabled={saving}
                      >
                        {saving
                          ? '⏳ Enregistrement...'
                          : absents.size === 0
                          ? '✓ Enregistrer — 0 absent (tous présents)'
                          : `✓ Enregistrer — ${absents.size} absent(s)`
                        }
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================
   ADMIN / DÉVELOPPEUR VIEW — full management
   ================================================================ */
const AdminAbsenceView = () => {
  const [absences, setAbsences] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterGroupe, setFilterGroupe] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [form, setForm] = useState({ etudiant_id: '', module_id: '', date_absence: '', seance: 's1', motif: '' });
  const [bulkForm, setBulkForm] = useState({ module_id: '', date_absence: '', seance: 's1', groupe_id: '', absents: [] });
  const [bulkGroupe, setBulkGroupe] = useState('');

  const fetchAbsences = useCallback(async () => {
    try {
      const params = {};
      if (filterGroupe) params.groupe_id = filterGroupe;
      const res = await api.get('/absences', { params });
      setAbsences(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  }, [filterGroupe]);

  useEffect(() => {
    fetchAbsences();
    api.get('/groupes').then(r => setGroupes(Array.isArray(r.data) ? r.data : [])).catch(console.error);
    api.get('/modules').then(r => setModules(Array.isArray(r.data) ? r.data : [])).catch(console.error);
  }, [fetchAbsences]);

  useEffect(() => {
    if (filterGroupe) {
      api.get(`/groupes/${filterGroupe}/etudiants`).then(r => setStudents(Array.isArray(r.data) ? r.data : [])).catch(console.error);
    }
  }, [filterGroupe]);

  useEffect(() => {
    if (bulkGroupe) {
      api.get(`/groupes/${bulkGroupe}/etudiants`).then(r => setStudents(Array.isArray(r.data) ? r.data : [])).catch(console.error);
    }
  }, [bulkGroupe]);

  const handleAdd = async () => {
    try { await api.post('/absences', form); setShowModal(false); fetchAbsences(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleBulkAdd = async () => {
    try {
      await api.post('/absences/bulk', { ...bulkForm, groupe_id: bulkGroupe });
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
      ...prev, absents: prev.absents.includes(id) ? prev.absents.filter(x => x !== id) : [...prev.absents, id]
    }));
  };

  return (
    <div>
      <div className="page-header">
        <h2>Gestion des Absences</h2>
        <div className="flex gap-8">
          <button className="btn btn-outline" onClick={() => { setBulkGroupe(''); setBulkForm({ module_id: '', date_absence: new Date().toISOString().split('T')[0], seance: 's1', absents: [] }); setShowBulkModal(true); }}>
            📋 Appel de groupe
          </button>
          <button className="btn btn-primary" onClick={() => { setForm({ etudiant_id: '', module_id: '', date_absence: new Date().toISOString().split('T')[0], seance: 's1', motif: '' }); setShowModal(true); }}>
            + Ajouter
          </button>
        </div>
      </div>

      <div className="search-bar">
        <select className="form-control" style={{ width: 'auto' }} value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
          <option value="">Tous les groupes</option>
          {groupes.map(g => <option key={g.id} value={g.id}>{g.nom} — {g.filiere_nom}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-header"><h3>{absences.length} absence(s)</h3></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Étudiant</th><th>Module</th><th>Date</th><th>Séance</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {absences.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted" style={{ padding: 30 }}>Aucune absence</td></tr>
              ) : absences.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.etudiant_nom} {a.etudiant_prenom}</strong></td>
                  <td>{a.module_nom}</td>
                  <td>{new Date(a.date_absence).toLocaleDateString('fr-FR')}</td>
                  <td>{SEANCE_LABELS[a.seance] || a.seance}</td>
                  <td>{a.justifiee ? <span className="badge badge-green">Justifiée</span> : <span className="badge badge-red">Non justifiée</span>}</td>
                  <td>
                    <div className="flex gap-8">
                      {!a.justifiee && <button className="btn-icon edit" onClick={() => handleJustify(a.id)} title="Justifier">✅</button>}
                      <button className="btn-icon danger" onClick={() => handleDelete(a.id)}>🗑️</button>
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
        footer={<><button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button><button className="btn btn-primary" onClick={handleAdd}>Enregistrer</button></>}
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
              {Object.entries(SEANCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal appel en masse */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Appel de Groupe"
        footer={<><button className="btn btn-outline" onClick={() => setShowBulkModal(false)}>Annuler</button><button className="btn btn-danger" onClick={handleBulkAdd}>{bulkForm.absents.length} absent(s) — Enregistrer</button></>}
      >
        <div className="form-group">
          <label>Groupe *</label>
          <select className="form-control" value={bulkGroupe} onChange={e => setBulkGroupe(e.target.value)}>
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
            {Object.entries(SEANCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Cocher les absents:</label>
          <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
            {students.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer' }}>
                <input type="checkbox" checked={bulkForm.absents.includes(s.id)} onChange={() => toggleBulkStudent(s.id)} style={{ width: 18, height: 18, accentColor: '#EF4444' }} />
                <span>{s.nom} {s.prenom}</span>
              </label>
            ))}
            {students.length === 0 && <p className="text-muted" style={{ fontSize: 13 }}>Sélectionnez un groupe d'abord</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ================================================================
   PROF ABSENCES TAB — admin marks professors absent
   ================================================================ */
const ProfAbsencesTab = () => {
  const [absencesProfs, setAbsencesProfs] = useState([]);
  const [profs, setProfs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ professeur_id: '', date_absence: new Date().toISOString().split('T')[0], motif: '' });
  const [loading, setLoading] = useState(false);

  const fetchAbsencesProfs = useCallback(async () => {
    try {
      const res = await api.get('/absences/profs');
      setAbsencesProfs(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchAbsencesProfs();
    api.get('/users?role=professeur&limit=100')
      .then(r => setProfs(Array.isArray(r.data?.users) ? r.data.users : []))
      .catch(console.error);
  }, [fetchAbsencesProfs]);

  const handleAdd = async () => {
    if (!form.professeur_id || !form.date_absence) return alert('Professeur et date sont requis.');
    setLoading(true);
    try {
      await api.post('/absences/profs', form);
      setShowModal(false);
      setForm({ professeur_id: '', date_absence: new Date().toISOString().split('T')[0], motif: '' });
      fetchAbsencesProfs();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette absence ?')) return;
    try {
      await api.delete(`/absences/profs/${id}`);
      fetchAbsencesProfs();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Marquer Prof Absent
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🔴 {absencesProfs.length} absence(s) de professeurs</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Professeur</th>
                <th>Date</th>
                <th>Motif</th>
                <th>Enregistré par</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {absencesProfs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted" style={{ padding: 30 }}>
                    Aucune absence professeur enregistrée
                  </td>
                </tr>
              ) : absencesProfs.map(a => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.prof_nom} {a.prof_prenom}</strong>
                  </td>
                  <td>{new Date(a.date_absence).toLocaleDateString('fr-FR')}</td>
                  <td>{a.motif || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {a.created_by_nom} {a.created_by_prenom}
                  </td>
                  <td>
                    <button className="btn-icon danger" onClick={() => handleDelete(a.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Marquer un Professeur Absent"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
            <button className="btn btn-danger" onClick={handleAdd} disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Professeur *</label>
          <select
            className="form-control"
            value={form.professeur_id}
            onChange={e => setForm({ ...form, professeur_id: e.target.value })}
          >
            <option value="">-- Choisir un professeur --</option>
            {profs.map(p => (
              <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            className="form-control"
            value={form.date_absence}
            onChange={e => setForm({ ...form, date_absence: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Motif (optionnel)</label>
          <input
            className="form-control"
            placeholder="ex: Maladie, congé..."
            value={form.motif}
            onChange={e => setForm({ ...form, motif: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
};

/* ================================================================
   MAIN — route to correct view based on role
   ================================================================ */
const TAB_STYLES = `
  .absence-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--border);
    margin-bottom: 20px;
  }
  .absence-tab {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: none;
    color: var(--text-muted);
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    transition: color 0.2s, border-color 0.2s;
  }
  .absence-tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
  .absence-tab:hover:not(.active) {
    color: var(--text);
  }
`;

let absenceTabStylesInjected = false;

const Absences = () => {
  const { user } = useAuth();

  // Inject tab styles once
  if (!absenceTabStylesInjected) {
    absenceTabStylesInjected = true;
    const el = document.createElement('style');
    el.textContent = TAB_STYLES;
    document.head.appendChild(el);
  }

  const [activeTab, setActiveTab] = useState('etudiants');

  if (user?.role === 'professeur') return <ProfAbsenceView />;

  const isAdminRole = user?.role === 'admin' || user?.role === 'developpeur';

  if (!isAdminRole) return <AdminAbsenceView />;

  return (
    <div>
      <div className="absence-tabs">
        <button
          className={`absence-tab${activeTab === 'etudiants' ? ' active' : ''}`}
          onClick={() => setActiveTab('etudiants')}
        >
          🎓 Absences Étudiants
        </button>
        <button
          className={`absence-tab${activeTab === 'profs' ? ' active' : ''}`}
          onClick={() => setActiveTab('profs')}
        >
          👨‍🏫 Absences Professeurs
        </button>
      </div>

      {activeTab === 'etudiants' ? <AdminAbsenceView /> : <ProfAbsencesTab />}
    </div>
  );
};

export default Absences;
