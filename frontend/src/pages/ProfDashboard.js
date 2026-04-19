import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ProfDashboard = () => {
  const { user } = useAuth();
  const [planning, setPlanning] = useState([]);
  const [enseignements, setEnseignements] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const planRes = await api.get('/planning');
        setPlanning(planRes.data);
      } catch (err) { console.error(err); }
    };
    fetch();
  }, []);

  const today = new Date();
  const jourActuel = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][today.getDay()];
  const coursAujourdhui = planning.filter(p => p.jour === jourActuel);

  return (
    <div>
      <div className="page-header">
        <h2>Mon Espace Professeur</h2>
        <span className="badge badge-blue">Professeur</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div className="stat-info">
            <h4>{planning.length}</h4>
            <p>Séances / semaine</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📅</div>
          <div className="stat-info">
            <h4>{coursAujourdhui.length}</h4>
            <p>Cours aujourd'hui</p>
          </div>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-header">
          <h3>📅 Cours d'aujourd'hui ({jourActuel})</h3>
        </div>
        <div className="card-body">
          {coursAujourdhui.length === 0 ? (
            <p className="text-muted">Aucun cours prévu aujourd'hui.</p>
          ) : coursAujourdhui.map(c => (
            <div key={c.id} className="planning-item" style={{marginBottom: 8}}>
              <div className="module">{c.module_nom}</div>
              <div style={{fontSize: 13}}>{c.heure_debut?.slice(0,5)} - {c.heure_fin?.slice(0,5)} • {c.groupe_nom}</div>
              {c.salle && <div className="salle">📍 {c.salle}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>ℹ️ Aide</h3>
        </div>
        <div className="card-body">
          <p>Utilisez le menu à gauche pour:</p>
          <p style={{marginTop: 8}}>📝 <strong>Saisie Notes</strong> — Entrer les notes de vos étudiants</p>
          <p style={{marginTop: 4}}>📅 <strong>Saisie Absences</strong> — Faire l'appel et noter les absences</p>
          <p style={{marginTop: 4}}>🕐 <strong>Mon Planning</strong> — Consulter votre emploi du temps</p>
        </div>
      </div>
    </div>
  );
};

export default ProfDashboard;
