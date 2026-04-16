import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

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
    <div style={styles.page}>
      {/* Animated background circles */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />
      <div style={styles.bgCircle3} />
      <div style={styles.bgGrid} />

      {/* Left Panel */}
      <div style={{...styles.leftPanel, opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-40px)', transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)'}}>

        {/* Logo big */}
        <div style={styles.leftLogo}>
          <div style={styles.logoBg}>
            <img src="/logo.png" alt="ETEC" style={styles.logoImg} />
          </div>
          <div style={styles.logoGlow} />
        </div>

        <h1 style={styles.leftTitle}>ETEC</h1>
        <p style={styles.leftSubtitle}>Centre de Formation Professionnelle</p>
        <p style={styles.leftCity}>📍 Fès, Maroc</p>

        <div style={styles.divider} />

        {/* Features */}
        <div style={styles.features}>
          {[
            { icon: '🎓', text: 'Gestion des filières & modules' },
            { icon: '👥', text: 'Suivi des étudiants & professeurs' },
            { icon: '📊', text: 'Notes, absences & planning' },
            { icon: '📢', text: 'Annonces & communications' },
          ].map((f, i) => (
            <div key={i} style={{...styles.featureItem, animationDelay: `${i * 0.1}s`}}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <span style={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={styles.leftFooter}>
          <span style={styles.versionBadge}>v2.0 · 2025</span>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{...styles.rightPanel, opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(40px)', transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1) 0.2s'}}>

        <div style={styles.formCard}>
          {/* Mobile logo */}
          <div style={styles.mobileHeader}>
            <img src="/logo.png" alt="ETEC" style={styles.mobileLogoImg} />
            <div>
              <div style={styles.mobileTitle}>ETEC</div>
              <div style={styles.mobileSubtitle}>Centre de Formation</div>
            </div>
          </div>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Bienvenue 👋</h2>
            <p style={styles.formSubtitle}>Connectez-vous à votre espace</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Adresse email</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>✉️</span>
                <input
                  type="email"
                  placeholder="votre@email.ma"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  onFocus={e => e.target.parentElement.style.borderColor = '#1A6B8A'}
                  onBlur={e => e.target.parentElement.style.borderColor = '#E2E8F0'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Mot de passe</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{...styles.input, paddingRight: '44px'}}
                  onFocus={e => e.target.parentElement.style.borderColor = '#1A6B8A'}
                  onBlur={e => e.target.parentElement.style.borderColor = '#E2E8F0'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.8 : 1,
                transform: loading ? 'scale(0.98)' : 'scale(1)',
              }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(11,79,108,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(11,79,108,0.4)'; }}
            >
              {loading ? (
                <span style={{display:'flex',alignItems:'center',gap:'10px',justifyContent:'center'}}>
                  <span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⏳</span>
                  Connexion en cours...
                </span>
              ) : (
                <span style={{display:'flex',alignItems:'center',gap:'10px',justifyContent:'center'}}>
                  Se connecter
                  <span style={{fontSize:'18px'}}>→</span>
                </span>
              )}
            </button>
          </form>

          {/* Roles info */}
          <div style={styles.rolesSection}>
            <div style={styles.rolesDivider}>
              <div style={styles.rolesDividerLine}/>
              <span style={styles.rolesDividerText}>Espaces disponibles</span>
              <div style={styles.rolesDividerLine}/>
            </div>
            <div style={styles.rolesGrid}>
              {[
                { label: 'Développeur', color: '#EF4444', bg: '#FEF2F2', icon: '⚙️' },
                { label: 'Admin', color: '#F59E0B', bg: '#FFFBEB', icon: '🏫' },
                { label: 'Professeur', color: '#3B82F6', bg: '#EFF6FF', icon: '👨‍🏫' },
                { label: 'Étudiant', color: '#10B981', bg: '#F0FDF4', icon: '🎓' },
              ].map((r, i) => (
                <div key={i} style={{...styles.roleChip, background: r.bg, color: r.color, borderColor: r.color+'30'}}>
                  {r.icon} {r.label}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.cardFooter}>
            © 2025 ETEC · Tous droits réservés
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #94A3B8; }
        input:focus { outline: none; }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { width: 100% !important; }
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    background: 'linear-gradient(135deg, #051F2D 0%, #0B4F6C 50%, #0D5C3A 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', width: '700px', height: '700px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(46,139,87,0.12) 0%, transparent 70%)',
    top: '-200px', right: '-100px',
    animation: 'pulse 8s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute', width: '500px', height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(11,79,108,0.2) 0%, transparent 70%)',
    bottom: '-150px', left: '-100px',
    animation: 'pulse 10s ease-in-out infinite 2s',
    pointerEvents: 'none',
  },
  bgCircle3: {
    position: 'absolute', width: '300px', height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
    top: '40%', left: '30%',
    animation: 'float 12s ease-in-out infinite',
    pointerEvents: 'none',
  },
  bgGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },

  // LEFT PANEL
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 50px',
    position: 'relative',
    zIndex: 1,
  },
  leftLogo: {
    position: 'relative',
    marginBottom: '28px',
  },
  logoBg: {
    width: '140px', height: '140px',
    borderRadius: '32px',
    background: 'rgba(255,255,255,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
    animation: 'float 6s ease-in-out infinite',
  },
  logoGlow: {
    position: 'absolute', inset: '-15px',
    borderRadius: '40px',
    background: 'radial-gradient(circle, rgba(46,139,87,0.3) 0%, transparent 70%)',
    filter: 'blur(10px)',
    zIndex: -1,
  },
  logoImg: {
    width: '110px', height: '110px',
    objectFit: 'contain',
  },
  leftTitle: {
    fontSize: '56px',
    fontWeight: '900',
    color: 'white',
    letterSpacing: '8px',
    textShadow: '0 4px 20px rgba(0,0,0,0.3)',
    marginBottom: '8px',
  },
  leftSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: '6px',
    textAlign: 'center',
  },
  leftCity: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: '32px',
  },
  divider: {
    width: '60px', height: '3px',
    background: 'linear-gradient(90deg, var(--green, #2E8B57), transparent)',
    borderRadius: '2px',
    marginBottom: '32px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
    maxWidth: '340px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 18px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
  },
  featureIcon: { fontSize: '20px' },
  featureText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '14px',
    fontWeight: '500',
  },
  leftFooter: {
    marginTop: '40px',
  },
  versionBadge: {
    padding: '6px 16px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '20px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
  },

  // RIGHT PANEL
  rightPanel: {
    width: '480px',
    minWidth: '480px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 40px',
    position: 'relative',
    zIndex: 1,
  },
  formCard: {
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(20px)',
    borderRadius: '28px',
    padding: '44px 40px',
    width: '100%',
    boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.15)',
  },
  mobileHeader: {
    display: 'none',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
    paddingBottom: '20px',
    borderBottom: '1px solid #E2E8F0',
  },
  mobileLogoImg: { width: '48px', height: '48px', borderRadius: '12px' },
  mobileTitle: { fontSize: '22px', fontWeight: '800', color: '#0B4F6C', letterSpacing: '2px' },
  mobileSubtitle: { fontSize: '11px', color: '#94A3B8' },
  formHeader: { marginBottom: '28px' },
  formTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: '6px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#64748B',
    fontWeight: '500',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
    color: '#991B1B',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13.5px',
    marginBottom: '20px',
    border: '1px solid #FECACA',
    fontWeight: '500',
  },
  inputGroup: { marginBottom: '20px' },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#374151',
    marginBottom: '8px',
    letterSpacing: '0.2px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #E2E8F0',
    borderRadius: '12px',
    background: '#FAFBFC',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    overflow: 'hidden',
  },
  inputIcon: {
    padding: '0 12px 0 16px',
    fontSize: '17px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '13px 12px',
    border: 'none',
    background: 'transparent',
    fontSize: '14.5px',
    color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    padding: '0 14px',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#94A3B8',
    flexShrink: 0,
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #0B4F6C 0%, #1A6B8A 50%, #2E8B57 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(11,79,108,0.4)',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    marginTop: '8px',
    letterSpacing: '0.3px',
    fontFamily: 'Inter, sans-serif',
  },
  rolesSection: { marginTop: '28px' },
  rolesDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
  },
  rolesDividerLine: {
    flex: 1, height: '1px',
    background: '#E2E8F0',
  },
  rolesDividerText: {
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    whiteSpace: 'nowrap',
  },
  rolesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  roleChip: {
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1.5px solid',
    textAlign: 'center',
    letterSpacing: '0.2px',
  },
  cardFooter: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '11.5px',
    color: '#CBD5E1',
    borderTop: '1px solid #F1F5F9',
    paddingTop: '16px',
  },
};

export default Login;
