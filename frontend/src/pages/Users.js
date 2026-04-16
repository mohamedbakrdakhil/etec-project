import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', telephone: '', cin: '', adresse: '', role: 'etudiant' });
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users', { params: { page, search, role: roleFilter, limit: 20 } });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ nom: '', prenom: '', email: '', password: '', telephone: '', cin: '', adresse: '', role: 'etudiant' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, password: '', telephone: u.telephone || '', cin: u.cin || '', adresse: u.adresse || '', role: u.role });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, { ...form, is_active: editUser.is_active });
      } else {
        await api.post('/users', form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur — vérifiez que l\'email n\'est pas déjà utilisé.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const openPasswordModal = (u) => {
    setPasswordUser(u);
    setNewPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      setPasswordError('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }
    try {
      await api.put(`/users/${passwordUser.id}/reset-password`, { newPassword });
      setShowPasswordModal(false);
      alert(`✅ Mot de passe de ${passwordUser.nom} ${passwordUser.prenom} modifié avec succès!`);
    } catch (err) {
      setPasswordError('Erreur lors de la modification.');
    }
  };

  const getRoleBadge = (role) => {
    const colors = { developpeur: 'badge-red', admin: 'badge-orange', professeur: 'badge-blue', etudiant: 'badge-green' };
    const labels = { developpeur: 'Dev', admin: 'Admin', professeur: 'Prof', etudiant: 'Étudiant' };
    return <span className={`badge ${colors[role]}`}>{labels[role]}</span>;
  };

  const roleOptions = currentUser?.role === 'developpeur'
    ? ['developpeur', 'admin', 'professeur', 'etudiant']
    : ['admin', 'professeur', 'etudiant'];

  return (
    <div>
      <div className="page-header">
        <h2>Gestion des Utilisateurs</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouveau</button>
      </div>

      <div className="search-bar">
        <div className="search-input">
          <span className="search-icon">🔍</span>
          <input placeholder="Rechercher par nom, email, CIN..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-control" style={{width: 'auto'}} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">Tous les rôles</option>
          <option value="professeur">Professeurs</option>
          <option value="etudiant">Étudiants</option>
          <option value="admin">Admins</option>
          {currentUser?.role === 'developpeur' && <option value="developpeur">Développeurs</option>}
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{total} utilisateur(s)</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>CIN</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-muted" style={{padding: 30}}>Aucun utilisateur trouvé</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.nom} {u.prenom}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.cin || '—'}</td>
                  <td>{u.telephone || '—'}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td>{u.is_active ? <span className="badge badge-green">Actif</span> : <span className="badge badge-gray">Inactif</span>}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn-icon edit" onClick={() => openEdit(u)} title="Modifier">✏️</button>
                      <button className="btn-icon" onClick={() => openPasswordModal(u)} title="Changer MDP">🔑</button>
                      <button className="btn-icon danger" onClick={() => handleDelete(u.id)} title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 20 && (
        <div className="flex justify-between items-center" style={{marginTop: 16}}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
          <span className="text-sm text-muted">Page {page}</span>
          <button className="btn btn-outline btn-sm" disabled={users.length < 20} onClick={() => setPage(p => p + 1)}>Suivant →</button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </>}
      >
        {error && <div className="login-error">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label>Nom *</label>
            <input className="form-control" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Prénom *</label>
            <input className="form-control" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input type="email" className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        {!editUser && (
          <div className="form-group">
            <label>Mot de passe (défaut: etec2024)</label>
            <input type="password" className="form-control" placeholder="etec2024" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label>CIN</label>
            <input className="form-control" value={form.cin} onChange={e => setForm({...form, cin: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Téléphone</label>
            <input className="form-control" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>Adresse</label>
          <textarea className="form-control" rows="2" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Rôle *</label>
          <select className="form-control" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            {roleOptions.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
      </Modal>

      {/* Modal Changer Mot de Passe */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)}
        title={`🔑 Changer mot de passe — ${passwordUser?.nom} ${passwordUser?.prenom}`}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleResetPassword}>Confirmer</button>
        </>}
      >
        {passwordError && <div className="login-error">{passwordError}</div>}
        <div className="form-group">
          <label>Nouveau mot de passe *</label>
          <input
            type="password"
            className="form-control"
            placeholder="Entrez le nouveau mot de passe..."
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoFocus
          />
          <small style={{color:'#6B7280', marginTop: 4, display:'block'}}>Minimum 4 caractères</small>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
