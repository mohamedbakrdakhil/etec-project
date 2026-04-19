import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="text-center text-muted" style={{padding: '40px'}}>Chargement...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Tableau de bord</h2>
        <span className="badge badge-blue">{user?.role === 'developpeur' ? 'Mode Développeur' : 'Administration'}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">👥</div>
          <div className="stat-info">
            <h4>{stats.totalUsers}</h4>
            <p>Utilisateurs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">👨‍🏫</div>
          <div className="stat-info">
            <h4>{stats.totalProfs}</h4>
            <p>Professeurs</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🎒</div>
          <div className="stat-info">
            <h4>{stats.totalEtudiants}</h4>
            <p>Étudiants</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🎓</div>
          <div className="stat-info">
            <h4>{stats.totalFilieres}</h4>
            <p>Filières</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">📋</div>
          <div className="stat-info">
            <h4>{stats.totalGroupes}</h4>
            <p>Groupes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div className="stat-info">
            <h4>{stats.totalModules}</h4>
            <p>Modules</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Bienvenue, {user?.prenom} {user?.nom}</h3>
        </div>
        <div className="card-body">
          <p className="text-muted">
            Bienvenue sur le système de gestion scolaire ETEC. 
            Utilisez le menu à gauche pour naviguer entre les différentes sections.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
