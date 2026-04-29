import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

// ── CSS injected once ─────────────────────────────────────────────────────
const AI_STYLES = `
  @keyframes ai-orb-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ai-orb-breathe {
    0%,100% { transform: scale(1); box-shadow: 0 0 20px rgba(6,214,160,0.5), 0 0 40px rgba(124,58,237,0.25); }
    50%     { transform: scale(1.07); box-shadow: 0 0 35px rgba(6,214,160,0.7), 0 0 60px rgba(124,58,237,0.4); }
  }
  @keyframes ai-ring-pulse {
    0%   { transform: scale(1);   opacity: 0.6; }
    70%  { transform: scale(1.7); opacity: 0; }
    100% { transform: scale(1.7); opacity: 0; }
  }
  @keyframes ai-particle {
    0%   { transform: translate(0,0) scale(1); opacity:0.8; }
    100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity:0; }
  }
  @keyframes ai-panel-in {
    from { opacity:0; transform: translateY(20px) scale(0.96); }
    to   { opacity:1; transform: translateY(0) scale(1); }
  }
  @keyframes ai-msg-in {
    from { opacity:0; transform: translateY(8px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes ai-dot {
    0%,80%,100% { transform: scale(0.6); opacity:0.4; }
    40%         { transform: scale(1);   opacity:1; }
  }
  @keyframes ai-cursor-blink {
    0%,100% { opacity:1; }
    50%     { opacity:0; }
  }
  @keyframes ai-badge-pop {
    0%   { transform: scale(0); }
    60%  { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
  @keyframes ai-nav-slide {
    from { opacity:0; transform:translateX(10px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes ai-shimmer {
    from { background-position: -200% center; }
    to   { background-position: 200% center; }
  }

  .ai-msg { animation: ai-msg-in 0.3s ease both; }
  .ai-typing-dot { animation: ai-dot 1.4s ease-in-out infinite; }

  .ai-send-btn:not(:disabled):hover {
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 0 4px 20px rgba(6,214,160,0.5) !important;
  }
  .ai-chip:hover {
    border-color: var(--accent) !important;
    color: var(--accent) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(6,214,160,0.2);
  }
  .ai-nav-item:hover {
    background: rgba(6,214,160,0.15) !important;
    border-color: rgba(6,214,160,0.4) !important;
  }
`;

let aiStylesInjected = false;
function injectAIStyles() {
  if (aiStylesInjected) return;
  aiStylesInjected = true;
  const el = document.createElement('style');
  el.textContent = AI_STYLES;
  document.head.appendChild(el);
}

// ── Role-aware quick actions ──────────────────────────────────────────────
const ROLE_ACTIONS = {
  developpeur: [
    { label: '📊 Stats live', msg: 'Donne-moi les statistiques en temps réel' },
    { label: '📅 Planning aujourd\'hui', msg: 'Qu\'est-ce qu\'il y a au planning aujourd\'hui ?' },
    { label: '📋 Absences récentes', msg: 'Quels étudiants ont le plus d\'absences ?' },
    { label: '👥 Utilisateurs', msg: 'Aller aux utilisateurs' },
    { label: '💰 Paiements', msg: 'Aller aux paiements' },
  ],
  admin: [
    { label: '📊 Stats live', msg: 'Donne-moi les statistiques en temps réel' },
    { label: '📅 Planning aujourd\'hui', msg: 'Qu\'est-ce qu\'il y a au planning aujourd\'hui ?' },
    { label: '📋 Absences récentes', msg: 'Quels étudiants ont le plus d\'absences ?' },
    { label: '👥 Utilisateurs', msg: 'Aller aux utilisateurs' },
    { label: '📢 Annonces', msg: 'Aller aux annonces' },
  ],
  professeur: [
    { label: '📅 Mes cours aujourd\'hui', msg: 'Quels sont mes cours aujourd\'hui ?' },
    { label: '✏️ Saisir des notes', msg: 'Aller saisir des notes' },
    { label: '📋 Saisir des absences', msg: 'Aller saisir des absences' },
    { label: '🗓️ Mon planning', msg: 'Voir mon planning' },
  ],
  etudiant: [
    { label: '📝 Mes notes', msg: 'Quelles sont mes dernières notes ?' },
    { label: '📅 Mes absences', msg: 'Combien d\'absences j\'ai ?' },
    { label: '🗓️ Mon planning', msg: 'Voir mon planning' },
    { label: '💰 Mes paiements', msg: 'Aller aux paiements' },
  ],
};

// ── Floating orb with particles ───────────────────────────────────────────
const OrbButton = ({ open, onClick, hasNew }) => {
  const orbRef = useRef(null);
  const particlesRef = useRef([]);

  const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i / 8) * 360,
    radius: 35 + Math.random() * 12,
    delay: i * 0.3,
    dur: 2 + Math.random() * 1.5,
  }));

  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999 }}>
      {/* Pulse rings */}
      {!open && [0, 1].map(i => (
        <div key={i} style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          border: '2px solid rgba(6,214,160,0.4)',
          animation: `ai-ring-pulse 2.5s ease-out ${i * 0.8}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Orbiting particles */}
      {!open && PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          width: 4, height: 4,
          borderRadius: '50%',
          background: p.id % 2 === 0 ? '#06D6A0' : '#7C3AED',
          top: '50%', left: '50%',
          transformOrigin: '0 0',
          transform: `rotate(${p.angle}deg) translateX(${p.radius}px)`,
          animation: `ai-orb-spin ${p.dur}s linear ${p.delay}s infinite`,
          opacity: 0.7,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Main orb */}
      <button
        ref={orbRef}
        onClick={onClick}
        style={{
          position: 'relative',
          width: 58, height: 58,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: open ? 20 : 26,
          transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          background: open
            ? 'var(--surface-2)'
            : 'conic-gradient(from 0deg, #06D6A0, #7C3AED, #0EA5E9, #EC4899, #06D6A0)',
          animation: open ? 'none' : 'ai-orb-breathe 3s ease-in-out infinite',
          boxShadow: open
            ? '0 2px 8px rgba(0,0,0,0.2)'
            : '0 0 20px rgba(6,214,160,0.5), 0 0 40px rgba(124,58,237,0.25)',
          outline: 'none',
          overflow: 'hidden',
        }}
        title="ETEC AI"
      >
        {/* Inner glossy layer */}
        {!open && (
          <div style={{
            position: 'absolute',
            inset: 3,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3), transparent 60%)',
            pointerEvents: 'none',
          }} />
        )}

        {open ? '✕' : '✦'}

        {/* New message badge */}
        {hasNew && !open && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 14, height: 14,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EF4444, #F59E0B)',
            border: '2px solid var(--bg)',
            animation: 'ai-badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        )}
      </button>
    </div>
  );
};

// ── Typing indicator ──────────────────────────────────────────────────────
const TypingDots = () => (
  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
    {[0, 1, 2].map(i => (
      <span key={i} className="ai-typing-dot" style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent), #7C3AED)',
        animationDelay: `${i * 0.16}s`,
        display: 'inline-block',
      }} />
    ))}
  </span>
);

// ── Rich message renderer ─────────────────────────────────────────────────
const renderMessage = (text) => {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    const rendered = parts.map((p, j) =>
      j % 2 === 1
        ? <strong key={j} style={{ color: 'var(--accent)', fontWeight: 700 }}>{p}</strong>
        : p
    );

    // Bullet points
    if (line.startsWith('• ') || line.startsWith('- ')) {
      const content = line.slice(2);
      const contentParts = content.split(/\*\*([^*]+)\*\*/g);
      const contentRendered = contentParts.map((p, j) =>
        j % 2 === 1 ? <strong key={j} style={{ color: 'var(--accent)' }}>{p}</strong> : p
      );
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
          <span style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }}>▸</span>
          <span>{contentRendered}</span>
        </div>
      );
    }

    return (
      <div key={i} style={{ marginBottom: line === '' ? 4 : 0 }}>
        {rendered}
      </div>
    );
  });
};

// ── Nav destination label ─────────────────────────────────────────────────
const NAV_LABELS = {
  '/users': '👥 Utilisateurs', '/groupes': '📋 Groupes', '/notes': '📝 Notes',
  '/absences': '📅 Absences', '/planning': '🗓️ Planning', '/paiements': '💰 Paiements',
  '/filieres': '🎓 Filières', '/annonces': '📢 Annonces', '/logs': '🔍 Logs',
  '/enseignements': '🔗 Enseignements',
};
const getNavLabel = (path) => {
  const key = Object.keys(NAV_LABELS).find(k => path.endsWith(k));
  return key ? NAV_LABELS[key] : '📄 Page';
};

// ── Main AI component ─────────────────────────────────────────────────────
const AIAssistant = () => {
  injectAIStyles();

  const { user } = useAuth();
  const role = user?.role || 'etudiant';
  const firstName = user?.prenom || 'toi';

  const greetings = {
    developpeur: `Salam ${firstName} ! 🔧 Ana **ETEC AI** — ton assistant développeur.\nJe vois les données live du système. Que veux-tu faire ?`,
    admin:       `Salam ${firstName} ! 👋 Ana **ETEC AI** — ton assistant admin.\nJe connais les stats en temps réel. Comment je peux t'aider ?`,
    professeur:  `Salam ${firstName} ! 👨‍🏫 Ana **ETEC AI** — ton assistant.\nJe connais ton planning d'aujourd'hui. Que veux-tu ?`,
    etudiant:    `Salam ${firstName} ! 🎒 Ana **ETEC AI** — ton assistant.\nJe connais tes notes et absences. Dis-moi ce que tu veux !`,
  };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: greetings[role] || greetings.etudiant, streaming: false, id: 0 }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [navPending, setNavPending] = useState(null); // { path, label }
  const [hasNew, setHasNew] = useState(false);
  const [msgCount, setMsgCount] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      setHasNew(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, open]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);
    setNavPending(null);

    const id = msgCount;
    setMsgCount(c => c + 2);

    const userMsg = { role: 'user', content: msg, id };
    const history = messages.filter(m => !m.streaming).slice(1).map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [
      ...prev,
      userMsg,
      { role: 'assistant', content: '', streaming: true, id: id + 1 },
    ]);

    const token = localStorage.getItem('etec_token');
    const streamIdx = messages.length + 1;

    try {
      const resp = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: msg, history, context: { page: location.pathname } }),
      });

      if (!resp.ok) throw new Error('API error');

      const contentType = resp.headers.get('content-type') || '';

      // JSON fallback
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        setMessages(prev => {
          const upd = [...prev];
          const idx = upd.findIndex(m => m.id === id + 1);
          if (idx >= 0) upd[idx] = { role: 'assistant', content: data.response || 'Erreur.', streaming: false, id: id + 1 };
          return upd;
        });
        if (data.action?.type === 'navigate') {
          setNavPending({ path: data.action.path, label: getNavLabel(data.action.path) });
        }
        setLoading(false);
        if (!open) setHasNew(true);
        return;
      }

      // SSE streaming
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));

            if (evt.text) {
              accumulated += evt.text;
              setMessages(prev => {
                const upd = [...prev];
                const idx = upd.findIndex(m => m.id === id + 1);
                if (idx >= 0) upd[idx] = { ...upd[idx], content: accumulated, streaming: true };
                return upd;
              });
            }

            if (evt.done) {
              setMessages(prev => {
                const upd = [...prev];
                const idx = upd.findIndex(m => m.id === id + 1);
                if (idx >= 0) upd[idx] = { role: 'assistant', content: accumulated || 'Désolé, je n\'ai pas pu répondre.', streaming: false, id: id + 1 };
                return upd;
              });
              if (evt.action?.type === 'navigate') {
                setNavPending({ path: evt.action.path, label: getNavLabel(evt.action.path) });
              }
            }

            if (evt.error) {
              setMessages(prev => {
                const upd = [...prev];
                const idx = upd.findIndex(m => m.id === id + 1);
                if (idx >= 0) upd[idx] = { role: 'assistant', content: evt.text || 'Erreur.', streaming: false, id: id + 1 };
                return upd;
              });
            }
          } catch (e) { /* skip */ }
        }
      }

    } catch (err) {
      setMessages(prev => {
        const upd = [...prev];
        const idx = upd.findIndex(m => m.id === id + 1);
        if (idx >= 0) upd[idx] = { role: 'assistant', content: '⚠️ Erreur de connexion. Réessaie.', streaming: false, id: id + 1 };
        return upd;
      });
    }

    setLoading(false);
    if (!open) setHasNew(true);
  }, [input, loading, messages, navigate, location.pathname, open, msgCount]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: greetings[role] || greetings.etudiant, streaming: false, id: 0 }]);
    setNavPending(null);
    setMsgCount(1);
  };

  const doNavigate = () => {
    if (!navPending) return;
    navigate(navPending.path);
    setNavPending(null);
    setOpen(false);
  };

  const quickActions = ROLE_ACTIONS[role] || ROLE_ACTIONS.etudiant;
  const showChips = messages.length <= 1;

  return (
    <>
      <OrbButton open={open} onClick={() => setOpen(o => !o)} hasNew={hasNew} />

      {open && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          right: 20,
          width: 420,
          maxWidth: 'calc(100vw - 32px)',
          height: 600,
          maxHeight: 'calc(100vh - 130px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 24,
          overflow: 'hidden',
          zIndex: 9998,
          animation: 'ai-panel-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          // Glassmorphism
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          // Aurora border
          boxShadow: '0 0 0 1px rgba(6,214,160,0.25), 0 0 0 2px rgba(124,58,237,0.1), 0 24px 80px rgba(0,0,0,0.45)',
        }}>

          {/* Aurora top border */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #06D6A0, #7C3AED, #0EA5E9, #EC4899, #06D6A0)',
            backgroundSize: '200% 100%',
            animation: 'ai-shimmer 3s linear infinite',
            zIndex: 10,
          }} />

          {/* Header */}
          <div style={{
            padding: '16px 18px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(6,214,160,0.06), rgba(124,58,237,0.04))',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            {/* AI Avatar */}
            <div style={{
              width: 42, height: 42,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #06D6A0, #7C3AED, #0EA5E9, #06D6A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
              position: 'relative',
              animation: 'ai-orb-breathe 3s ease-in-out infinite',
              boxShadow: '0 0 15px rgba(6,214,160,0.4)',
            }}>
              <div style={{
                position: 'absolute', inset: 3, borderRadius: '50%',
                background: 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>✦</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 800, fontSize: 15, color: 'var(--text)',
                background: 'linear-gradient(90deg, #06D6A0, #7C3AED)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>ETEC AI</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
                Assistant IA · Données live
              </div>
            </div>

            <button onClick={clearChat} title="Nouveau chat" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, padding: '4px 8px',
              borderRadius: 8, transition: 'color 0.2s',
            }} onMouseEnter={e => e.target.style.color = '#EF4444'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
              🗑️
            </button>
          </div>

          {/* Nav card (if navigation pending) */}
          {navPending && (
            <div style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, rgba(6,214,160,0.1), rgba(14,165,233,0.06))',
              borderBottom: '1px solid rgba(6,214,160,0.2)',
              display: 'flex', alignItems: 'center', gap: 10,
              animation: 'ai-nav-slide 0.3s ease',
              flexShrink: 0,
            }}>
              <div style={{
                flex: 1, fontSize: 13, color: 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>🧭</span>
                <span>Naviguer vers <strong style={{ color: 'var(--accent)' }}>{navPending.label}</strong></span>
              </div>
              <button onClick={doNavigate} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: 'linear-gradient(135deg, var(--accent), #0EA5E9)',
                border: 'none', color: 'white', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 10px rgba(6,214,160,0.35)',
              }}>
                Aller →
              </button>
              <button onClick={() => setNavPending(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 16,
              }}>✕</button>
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {messages.map((m) => (
              <div key={m.id} className="ai-msg" style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 8,
              }}>
                {/* AI Avatar (small) */}
                {m.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'conic-gradient(from 0deg, #06D6A0, #7C3AED, #0EA5E9, #06D6A0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 2, borderRadius: '50%',
                      background: 'var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11,
                    }}>✦</div>
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #06D6A0, #0EA5E9)'
                    : 'var(--surface-2)',
                  color: m.role === 'user' ? '#000' : 'var(--text)',
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  wordBreak: 'break-word',
                  boxShadow: m.role === 'user'
                    ? '0 4px 15px rgba(6,214,160,0.3)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  {m.content === '' && m.streaming
                    ? <TypingDots />
                    : renderMessage(m.content)
                  }
                  {m.streaming && m.content !== '' && (
                    <span style={{
                      display: 'inline-block', width: 2, height: 14,
                      background: 'var(--accent)', marginLeft: 2, verticalAlign: 'middle',
                      animation: 'ai-cursor-blink 0.7s ease-in-out infinite',
                    }} />
                  )}
                </div>
              </div>
            ))}

            {/* Quick action chips */}
            {showChips && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
                {quickActions.map(a => (
                  <button key={a.msg} className="ai-chip" onClick={() => sendMessage(a.msg)} style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  }}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '12px 16px 14px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Pose ta question... (Entrée pour envoyer)"
                rows={1}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 14,
                  padding: '10px 14px',
                  color: 'var(--text)',
                  fontSize: 13.5,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.4,
                  maxHeight: 100,
                  overflowY: 'auto',
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(6,214,160,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Send button */}
            <button
              className="ai-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 42, height: 42,
                borderRadius: '50%',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                background: loading || !input.trim()
                  ? 'var(--surface-2)'
                  : 'linear-gradient(135deg, var(--accent), #0EA5E9)',
                boxShadow: loading || !input.trim() ? 'none' : '0 4px 15px rgba(6,214,160,0.35)',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              {loading
                ? <span style={{ animation: 'ai-orb-spin 0.8s linear infinite', display: 'inline-block', fontSize: 15 }}>⟳</span>
                : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
