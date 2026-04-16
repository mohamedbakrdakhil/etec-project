import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '?';
    return (user.prenom?.[0] || '') + (user.nom?.[0] || '');
  };

  const getRoleLabel = (role) => {
    const labels = {
      developpeur: 'Développeur',
      admin: 'Administrateur',
      professeur: 'Professeur',
      etudiant: 'Étudiant'
    };
    return labels[role] || role;
  };

  const menuItems = {
    developpeur: [
      { section: 'Général' },
      { path: '/dev', icon: '📊', label: 'Dashboard' },
      { path: '/dev/users', icon: '👥', label: 'Utilisateurs' },
      { section: 'Académique' },
      { path: '/dev/filieres', icon: '🎓', label: 'Filières' },
      { path: '/dev/groupes', icon: '📋', label: 'Groupes' },
      { path: '/dev/modules', icon: '📚', label: 'Modules' },
      { path: '/dev/enseignements', icon: '🔗', label: 'Enseignements' },
      { section: 'Scolarité' },
      { path: '/dev/notes', icon: '📝', label: 'Notes' },
      { path: '/dev/absences', icon: '📅', label: 'Absences' },
      { path: '/dev/planning', icon: '🕐', label: 'Planning' },
      { path: '/dev/paiements', icon: '💳', label: 'Paiements' },
      { section: 'Système' },
      { path: '/dev/annonces', icon: '📢', label: 'Annonces' },
      { path: '/dev/logs', icon: '🔍', label: 'Logs Système' },
    ],
    admin: [
      { section: 'Général' },
      { path: '/admin', icon: '📊', label: 'Dashboard' },
      { path: '/admin/users', icon: '👥', label: 'Utilisateurs' },
      { section: 'Académique' },
      { path: '/admin/filieres', icon: '🎓', label: 'Filières' },
      { path: '/admin/groupes', icon: '📋', label: 'Groupes' },
      { path: '/admin/modules', icon: '📚', label: 'Modules' },
      { path: '/admin/enseignements', icon: '🔗', label: 'Enseignements' },
      { section: 'Scolarité' },
      { path: '/admin/notes', icon: '📝', label: 'Notes' },
      { path: '/admin/absences', icon: '📅', label: 'Absences' },
      { path: '/admin/planning', icon: '🕐', label: 'Planning' },
      { path: '/admin/paiements', icon: '💳', label: 'Paiements' },
      { section: 'Communication' },
      { path: '/admin/annonces', icon: '📢', label: 'Annonces' },
    ],
    professeur: [
      { section: 'Espace Professeur' },
      { path: '/prof', icon: '📊', label: 'Dashboard' },
      { path: '/prof/notes', icon: '📝', label: 'Saisie Notes' },
      { path: '/prof/absences', icon: '📅', label: 'Saisie Absences' },
      { path: '/prof/planning', icon: '🕐', label: 'Mon Planning' },
    ],
    etudiant: [
      { section: 'Espace Étudiant' },
      { path: '/etudiant', icon: '📊', label: 'Dashboard' },
      { path: '/etudiant/notes', icon: '📝', label: 'Mes Notes' },
      { path: '/etudiant/absences', icon: '📅', label: 'Mes Absences' },
      { path: '/etudiant/planning', icon: '🕐', label: 'Mon Planning' },
    ]
  };

  const items = menuItems[user?.role] || [];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="ETEC" />
          <div>
            <h2>ETEC</h2>
            <span>Gestion Scolaire</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item, i) => {
            if (item.section) {
              return <div key={i} className="sidebar-section">{item.section}</div>;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dev' || item.path === '/admin' || item.path === '/prof' || item.path === '/etudiant'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials()}</div>
            <div className="sidebar-user-info">
              <p>{user?.prenom} {user?.nom}</p>
              <span>{getRoleLabel(user?.role)}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
