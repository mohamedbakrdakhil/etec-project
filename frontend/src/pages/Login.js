import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const routes = {
        developpeur: '/dev',
        admin: '/admin',
        professeur: '/prof',
        etudiant: '/etudiant'
      };
      navigate(routes[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Decorative background orbs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,214,160,0.08) 0%, transparent 70%)',
        top: -200, right: -100, pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(11,79,108,0.18) 0%, transparent 70%)',
        bottom: -100, left: -100, pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
        top: '40%', left: '15%', pointerEvents: 'none', zIndex: 0
      }} />

      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* The main glassmorphism card */}
      <div className="login-card" style={{ position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <img
          src="/logo.png"
          alt="ETEC"
          style={{ width: 72, height: 72, borderRadius: 18, marginBottom: 16,
                   boxShadow: '0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px rgba(6,214,160,0.2)' }}
          onError={e => {
            e.target.style.display = 'none';
          }}
        />

        {/* Brand */}
        <h1 style={{
          fontSize: 38, fontWeight: 900, letterSpacing: 5,
          color: '#06D6A0', marginBottom: 6,
          textShadow: '0 0 40px rgba(6,214,160,0.4)'
        }}>
          ETEC
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 36,
          fontWeight: 500, letterSpacing: 0.2
        }}>
          Système de Gestion Scolaire — Fès
        </p>

        <div className="login-divider" />

        {/* Error message */}
        {error && (
          <div className="login-error">
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left', marginBottom: 18 }}>
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@etec.ma"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left', marginBottom: 28 }}>
            <label>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)', fontSize: 16,
                  cursor: 'pointer', padding: 4,
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            className="btn login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner"
                  style={{ width: 18, height: 18, borderWidth: 2 }}
                />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Role chips */}
        <div style={{ marginTop: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{
              fontSize: 10, color: 'rgba(255,255,255,0.2)',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2
            }}>
              Accès disponibles
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8
          }}>
            {[
              { label: 'Développeur', color: 'rgba(239,68,68,0.7)',   bg: 'rgba(239,68,68,0.08)',   icon: '⚙' },
              { label: 'Admin',       color: 'rgba(245,158,11,0.7)',  bg: 'rgba(245,158,11,0.08)',  icon: '🏫' },
              { label: 'Professeur',  color: 'rgba(59,130,246,0.7)',  bg: 'rgba(59,130,246,0.08)',  icon: '👨‍🏫' },
              { label: 'Étudiant',    color: 'rgba(16,185,129,0.7)',  bg: 'rgba(16,185,129,0.08)',  icon: '🎓' },
            ].map((r, i) => (
              <div key={i} style={{
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 600,
                background: r.bg,
                color: r.color,
                border: `1px solid ${r.color.replace('0.7', '0.2')}`,
                textAlign: 'center',
                letterSpacing: 0.2,
              }}>
                {r.icon} {r.label}
              </div>
            ))}
          </div>
        </div>

        <div className="login-footer">
          ETEC Fès © 2025 — Tous droits réservés
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default Login;
