import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

// ── Color palette for modules ──────────────────────────────────────────────
const PALETTE = ['#0EA5E9', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06D6A0', '#8B5CF6'];
const getColor = (name) => {
  let h = 0;
  for (let c of (name || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

const TODAY_DAY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][new Date().getDay()];
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const HEURES = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

const EMPTY_FORM = { groupe_id: '', module_id: '', professeur_id: '', jour: 'lundi', heure_debut: '08:30', heure_fin: '11:00', salle: '' };

// ── CSS injected once ─────────────────────────────────────────────────────
const STYLES = `
  .planning-card {
    border-radius: 14px;
    padding: 12px 14px;
    margin-bottom: 10px;
    border-left: 4px solid;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: default;
    position: relative;
  }
  .planning-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .planning-card.cancelled {
    background: rgba(120,120,120,0.07) !important;
    border-left-color: #9CA3AF !important;
  }
  .planning-card.cancelled .card-module {
    text-decoration: line-through;
    color: #9CA3AF;
  }
  .day-col {
    border: 1px solid var(--border);
    border-radius: 0 0 12px 12px;
    min-height: 200px;
    padding: 8px;
  }
  .day-col.today-col {
    border: 2px solid rgba(16,185,129,0.5);
    box-shadow: 0 0 0 4px rgba(16,185,129,0.07), inset 0 0 0 1px rgba(16,185,129,0.15);
  }
  .day-header {
    padding: 10px;
    border-radius: 10px 10px 0 0;
    text-align: center;
    font-weight: 700;
    font-size: 13px;
    text-transform: capitalize;
    background: var(--surface-2);
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-bottom: none;
  }
  .day-header.today-header {
    background: linear-gradient(135deg, #10B981, #06D6A0);
    color: white;
    border-color: #10B981;
  }
  .badge-cancelled {
    display: inline-block;
    background: rgba(156,163,175,0.15);
    color: #9CA3AF;
    border: 1px solid rgba(156,163,175,0.3);
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 7px;
    margin-top: 4px;
  }
  .badge-rating {
    display: inline-block;
    background: rgba(245,158,11,0.15);
    color: #F59E0B;
    border: 1px solid rgba(245,158,11,0.3);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    margin-top: 4px;
  }
  .card-actions {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .btn-card-action {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    cursor: pointer;
    color: var(--text);
    transition: background 0.15s;
  }
  .btn-card-action:hover { background: var(--surface-3, #e5e7eb); }
  .btn-card-action.danger { color: #EF4444; border-color: rgba(239,68,68,0.3); }
  .btn-card-action.danger:hover { background: rgba(239,68,68,0.08); }
  .btn-card-action.warning { color: #F59E0B; border-color: rgba(245,158,11,0.3); }
  .btn-card-action.warning:hover { background: rgba(245,158,11,0.08); }
  .btn-card-action.success { color: #10B981; border-color: rgba(16,185,129,0.3); }
  .btn-card-action.success:hover { background: rgba(16,185,129,0.08); }
  .rating-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 2px solid var(--border);
    background: var(--surface-2);
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--text);
  }
  .rating-btn:hover, .rating-btn.selected {
    background: #F59E0B;
    border-color: #F59E0B;
    color: white;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .planning-card { animation: slideUp 0.25s ease both; }
`;

let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected) return;
  stylesInjected = true;
  const el = document.createElement('style');
  el.textContent = STYLES;
  document.head.appendChild(el);
};

// ── Session Card ──────────────────────────────────────────────────────────
const SessionCard = ({ p, isAdmin, isEtudiant, onEdit, onCancel, onRestore, onDelete, onRate, myEval }) => {
  const color = getColor(p.module_nom);
  const rgb = hexToRgb(color);
  const cancelled = p.statut === 'annulé';

  // Determine if session is "past" (today or before)
  // Since planning has day-of-week (not actual date), treat today's day as past for rating purposes
  const jourIndex = JOURS.indexOf(p.jour);
  const todayIndex = JOURS.indexOf(TODAY_DAY);
  const isPast = jourIndex <= todayIndex;

  return (
    <div
      className={`planning-card${cancelled ? ' cancelled' : ''}`}
      style={{
        borderLeftColor: cancelled ? '#9CA3AF' : color,
        background: cancelled ? undefined : `rgba(${rgb},0.07)`,
      }}
    >
      {/* Module name */}
      <div className="card-module" style={{ fontWeight: 700, fontSize: 13, color: cancelled ? '#9CA3AF' : color, marginBottom: 2 }}>
        {p.module_nom}
      </div>

      {/* Prof */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 1 }}>
        {p.prof_prenom} {p.prof_nom}
      </div>

      {/* Time */}
      <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, marginBottom: 2 }}>
        {p.heure_debut?.slice(0, 5)} – {p.heure_fin?.slice(0, 5)}
      </div>

      {/* Group */}
      {p.groupe_nom && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.groupe_nom}</div>
      )}

      {/* Salle */}
      {p.salle && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 {p.salle}</div>
      )}

      {/* Badges */}
      {cancelled && <div className="badge-cancelled">Annulé</div>}
      {myEval && (
        <div className="badge-rating">⭐ {myEval.note}/10</div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="card-actions">
          <button className="btn-card-action" onClick={() => onEdit(p)} title="Modifier">✏️ Modifier</button>
          {cancelled
            ? <button className="btn-card-action success" onClick={() => onRestore(p.id)} title="Restaurer">▶ Restaurer</button>
            : <button className="btn-card-action warning" onClick={() => onCancel(p.id)} title="Annuler">⏸ Annuler</button>
          }
          <button className="btn-card-action danger" onClick={() => onDelete(p.id)} title="Supprimer">🗑️ Supp.</button>
        </div>
      )}

      {/* Student: rate past sessions */}
      {isEtudiant && isPast && !cancelled && !myEval && (
        <div className="card-actions">
          <button className="btn-card-action success" onClick={() => onRate(p)}>⭐ Évaluer</button>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
const Planning = ({ readOnly = false }) => {
  injectStyles();

  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'admin' || role === 'developpeur';
  const isEtudiant = role === 'etudiant';

  const [planning, setPlanning] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [modules, setModules] = useState([]);
  const [profs, setProfs] = useState([]);
  const [filterGroupe, setFilterGroupe] = useState('');

  // My evaluations (etudiant): map planningId -> evaluation
  const [myEvals, setMyEvals] = useState({});

  // Admin evaluations (avg per session): map planningId -> {avgNote, count}
  const [sessionEvals, setSessionEvals] = useState({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Rating modal
  const [rateItem, setRateItem] = useState(null);
  const [rateNote, setRateNote] = useState(null);
  const [rateComment, setRateComment] = useState('');
  const [rateSaving, setRateSaving] = useState(false);

  const fetchPlanning = useCallback(async () => {
    try {
      const params = {};
      if (filterGroupe) params.groupe_id = filterGroupe;
      const res = await api.get('/planning', { params });
      const items = Array.isArray(res.data) ? res.data : [];
      setPlanning(items);
      return items;
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [filterGroupe]);

  const fetchEvaluations = useCallback(async (items) => {
    if (!items || items.length === 0) return;
    if (isEtudiant) {
      // Fetch my evaluation for each session
      const entries = await Promise.all(
        items.map(async (p) => {
          try {
            const r = await api.get(`/evaluations/my/${p.id}`);
            return [p.id, r.data.evaluation];
          } catch {
            return [p.id, null];
          }
        })
      );
      const map = {};
      entries.forEach(([id, ev]) => { if (ev) map[id] = ev; });
      setMyEvals(map);
    } else if (isAdmin) {
      // Fetch avg evaluations for each session
      const entries = await Promise.all(
        items.map(async (p) => {
          try {
            const r = await api.get(`/evaluations/${p.id}`);
            return [p.id, { avgNote: r.data.avgNote, count: r.data.count }];
          } catch {
            return [p.id, null];
          }
        })
      );
      const map = {};
      entries.forEach(([id, ev]) => { if (ev && ev.count > 0) map[id] = ev; });
      setSessionEvals(map);
    }
  }, [isEtudiant, isAdmin]);

  useEffect(() => {
    fetchPlanning().then(items => fetchEvaluations(items));
    api.get('/groupes').then(res => setGroupes(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    if (isAdmin) {
      api.get('/modules').then(res => setModules(Array.isArray(res.data) ? res.data : [])).catch(console.error);
      api.get('/users?role=professeur&limit=100').then(res => setProfs(Array.isArray(res.data?.users) ? res.data.users : [])).catch(console.error);
    }
  }, [fetchPlanning, fetchEvaluations, isAdmin]);

  const refresh = async () => {
    const items = await fetchPlanning();
    await fetchEvaluations(items);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────
  const handleAdd = async () => {
    try {
      await api.post('/planning', form);
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (p) => {
    setEditItem(p);
    setEditForm({
      groupe_id: p.groupe_id,
      module_id: p.module_id,
      professeur_id: p.professeur_id,
      jour: p.jour,
      heure_debut: p.heure_debut?.slice(0, 5),
      heure_fin: p.heure_fin?.slice(0, 5),
      salle: p.salle || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/planning/${editItem.id}`, editForm);
      setShowEditModal(false);
      setEditItem(null);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Annuler cette séance ?')) return;
    try {
      await api.patch(`/planning/${id}/cancel`);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.patch(`/planning/${id}/restore`);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette séance définitivement ?')) return;
    try {
      await api.delete(`/planning/${id}`);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const openRateModal = (p) => {
    setRateItem(p);
    setRateNote(null);
    setRateComment('');
  };

  const handleSubmitRating = async () => {
    if (!rateNote) return alert('Veuillez sélectionner une note.');
    setRateSaving(true);
    try {
      await api.post('/evaluations', { planning_id: rateItem.id, note: rateNote, commentaire: rateComment });
      setRateItem(null);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
    setRateSaving(false);
  };

  // ── Group planning by day ──────────────────────────────────────────────
  const planningByDay = {};
  JOURS.forEach(j => {
    planningByDay[j] = planning
      .filter(p => p.jour === j)
      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));
  });

  const SeanceFormFields = ({ f, setF }) => (
    <>
      <div className="form-group">
        <label>Groupe *</label>
        <select className="form-control" value={f.groupe_id} onChange={e => setF({ ...f, groupe_id: e.target.value })}>
          <option value="">-- Choisir --</option>
          {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Module *</label>
        <select className="form-control" value={f.module_id} onChange={e => setF({ ...f, module_id: e.target.value })}>
          <option value="">-- Choisir --</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Professeur *</label>
        <select className="form-control" value={f.professeur_id} onChange={e => setF({ ...f, professeur_id: e.target.value })}>
          <option value="">-- Choisir --</option>
          {profs.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Jour *</label>
        <select className="form-control" value={f.jour} onChange={e => setF({ ...f, jour: e.target.value })}>
          {JOURS.map(j => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Heure début *</label>
          <select className="form-control" value={f.heure_debut} onChange={e => setF({ ...f, heure_debut: e.target.value })}>
            {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Heure fin *</label>
          <select className="form-control" value={f.heure_fin} onChange={e => setF({ ...f, heure_fin: e.target.value })}>
            {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Salle</label>
        <input className="form-control" placeholder="ex: Salle A1" value={f.salle} onChange={e => setF({ ...f, salle: e.target.value })} />
      </div>
    </>
  );

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <h2>📅 {readOnly ? 'Mon Planning' : 'Planning'}</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowAddModal(true); }}>
            + Ajouter Séance
          </button>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="search-bar">
        <select className="form-control" style={{ width: 'auto' }} value={filterGroupe} onChange={e => setFilterGroupe(e.target.value)}>
          <option value="">Tous les groupes</option>
          {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}{g.filiere_nom ? ` — ${g.filiere_nom}` : ''}</option>)}
        </select>
        {TODAY_DAY && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            Aujourd'hui: <strong style={{ textTransform: 'capitalize', color: 'var(--text)' }}>{TODAY_DAY}</strong>
          </span>
        )}
      </div>

      {/* ── Weekly calendar grid ── */}
      <div className="card">
        <div className="card-body" style={{ overflowX: 'auto', padding: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${JOURS.length}, minmax(170px, 1fr))`,
            gap: 10,
            minWidth: 700,
          }}>
            {JOURS.map(j => {
              const isToday = j === TODAY_DAY;
              const sessions = planningByDay[j] || [];
              return (
                <div key={j}>
                  <div className={`day-header${isToday ? ' today-header' : ''}`}>
                    {isToday ? `☀️ ${j}` : j}
                  </div>
                  <div className={`day-col${isToday ? ' today-col' : ''}`}>
                    {sessions.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>—</p>
                    ) : (
                      sessions.map(p => (
                        <SessionCard
                          key={p.id}
                          p={p}
                          isAdmin={isAdmin}
                          isEtudiant={isEtudiant}
                          onEdit={handleEdit}
                          onCancel={handleCancel}
                          onRestore={handleRestore}
                          onDelete={handleDelete}
                          onRate={openRateModal}
                          myEval={myEvals[p.id] || null}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Add séance modal ── */}
      {isAdmin && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Ajouter une Séance"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAdd}>Enregistrer</button>
            </>
          }
        >
          <SeanceFormFields f={form} setF={setForm} />
        </Modal>
      )}

      {/* ── Edit séance modal ── */}
      {isAdmin && editItem && (
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditItem(null); }}
          title="Modifier la Séance"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Enregistrer</button>
            </>
          }
        >
          <SeanceFormFields f={editForm} setF={setEditForm} />
        </Modal>
      )}

      {/* ── Rating modal ── */}
      {isEtudiant && rateItem && (
        <Modal
          isOpen={true}
          onClose={() => setRateItem(null)}
          title={`Évaluer — ${rateItem.module_nom}`}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setRateItem(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmitRating} disabled={rateSaving || !rateNote}>
                {rateSaving ? 'Enregistrement...' : 'Soumettre'}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: 13 }}>
            {rateItem.heure_debut?.slice(0, 5)} – {rateItem.heure_fin?.slice(0, 5)} | {rateItem.groupe_nom}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, marginBottom: 10, display: 'block' }}>Note (1 = mauvais, 10 = excellent)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  className={`rating-btn${rateNote === n ? ' selected' : ''}`}
                  onClick={() => setRateNote(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Commentaire (optionnel)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Votre avis sur cette séance..."
              value={rateComment}
              onChange={e => setRateComment(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Planning;
