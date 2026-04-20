import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const SUGGESTIONS = [
  { label: '📊 Stats école', msg: 'Combien d\'étudiants et groupes ?' },
  { label: '👥 Groupes', msg: 'Aller aux groupes' },
  { label: '📝 Notes', msg: 'Aller aux notes' },
  { label: '📅 Planning', msg: 'Voir le planning' },
  { label: '❓ Aide', msg: 'Comment utiliser le système ?' },
];

const TypingDots = () => (
  <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--accent)',
        animation: `aiBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </span>
);

// Simple markdown renderer (bold, newlines, bullet points)
const renderText = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    const content = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
    return (
      <span key={i}>
        {line.startsWith('•') ? <span style={{ color: 'var(--accent)', marginRight: 4 }}>•</span> : null}
        {content}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
};

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Salam ! 👋 Ana **ETEC AI**, l\'assistant intelligent.\nDis-moi ce que tu veux faire ou où tu veux aller — je m\'en occupe !', streaming: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [navBanner, setNavBanner] = useState(null);
  const [hasNew, setHasNew] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setHasNew(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setLoading(true);

    const userMsg = { role: 'user', content: msg };
    const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const token = localStorage.getItem('etec_token');

    // Optimistic: add empty streaming message
    const streamingIdx = newMessages.length;
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const resp = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg,
          history,
          context: { page: location.pathname },
        }),
      });

      if (!resp.ok) throw new Error('API error');

      const contentType = resp.headers.get('content-type') || '';

      // --- JSON response (fallback mode) ---
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        setMessages(prev => {
          const updated = [...prev];
          updated[streamingIdx] = { role: 'assistant', content: data.response || 'Désolé, une erreur est survenue.', streaming: false };
          return updated;
        });
        if (data.action?.type === 'navigate') {
          showNavBanner(data.action.path);
          setTimeout(() => { navigate(data.action.path); setNavBanner(null); }, 1200);
        }
        setLoading(false);
        if (!open) setHasNew(true);
        return;
      }

      // --- SSE streaming response ---
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
                const updated = [...prev];
                updated[streamingIdx] = { role: 'assistant', content: accumulated, streaming: true };
                return updated;
              });
            }

            if (evt.done) {
              setMessages(prev => {
                const updated = [...prev];
                updated[streamingIdx] = { role: 'assistant', content: accumulated || 'Désolé, je n\'ai pas pu répondre.', streaming: false };
                return updated;
              });
              if (evt.action?.type === 'navigate') {
                showNavBanner(evt.action.path);
                setTimeout(() => { navigate(evt.action.path); setNavBanner(null); }, 1200);
              }
            }

            if (evt.error) {
              setMessages(prev => {
                const updated = [...prev];
                updated[streamingIdx] = { role: 'assistant', content: evt.text || 'Erreur IA.', streaming: false };
                return updated;
              });
            }
          } catch (e) { /* skip malformed */ }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[streamingIdx] = { role: 'assistant', content: 'Désolé, une erreur de connexion est survenue. Réessaie.', streaming: false };
        return updated;
      });
    }

    setLoading(false);
    if (!open) setHasNew(true);
  }, [input, loading, messages, navigate, location.pathname, open]);

  const showNavBanner = (path) => {
    const labels = {
      '/groupes': 'Groupes', '/users': 'Utilisateurs', '/notes': 'Notes',
      '/absences': 'Absences', '/planning': 'Planning', '/paiements': 'Paiements',
      '/filieres': 'Filières', '/modules': 'Modules', '/annonces': 'Annonces',
      '/logs': 'Journaux', '/enseignements': 'Enseignements',
    };
    const segment = Object.keys(labels).find(k => path.endsWith(k)) || '';
    setNavBanner(labels[segment] || 'page');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Salam ! 👋 Ana **ETEC AI**, l\'assistant intelligent.\nDis-moi ce que tu veux faire ou où tu veux aller — je m\'en occupe !', streaming: false }]);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: open ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--accent), #00b386)',
          border: open ? '2px solid var(--border)' : 'none',
          boxShadow: open ? 'none' : '0 0 0 0 rgba(6,214,160,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          animation: open ? 'none' : 'aiPulse 2.5s ease-in-out infinite',
        }}
        title="Assistant IA"
      >
        {open ? '✕' : '🤖'}
        {hasNew && !open && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 14, height: 14, borderRadius: '50%',
            background: '#ef4444', border: '2px solid var(--bg)',
          }} />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 96,
          right: 28,
          width: 380,
          maxWidth: 'calc(100vw - 40px)',
          height: 520,
          maxHeight: 'calc(100vh - 120px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,214,160,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 9998,
          animation: 'aiSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(6,214,160,0.08), rgba(124,58,237,0.05))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>ETEC AI</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                Assistant intelligent
              </div>
            </div>
            <button onClick={clearChat} title="Effacer" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 13, padding: '4px 8px', borderRadius: 6,
            }}>🗑️</button>
          </div>

          {/* Nav banner */}
          {navBanner && (
            <div style={{
              background: 'rgba(6,214,160,0.12)',
              borderBottom: '1px solid rgba(6,214,160,0.2)',
              padding: '8px 16px',
              fontSize: 13,
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              Navigation vers <strong>{navBanner}</strong>...
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #7C3AED)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, flexShrink: 0, marginRight: 8, marginTop: 2,
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, var(--accent), #00b386)'
                    : 'var(--surface-2)',
                  color: m.role === 'user' ? '#000' : 'var(--text)',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  wordBreak: 'break-word',
                }}>
                  {m.content === '' && m.streaming ? <TypingDots /> : renderText(m.content)}
                  {m.streaming && m.content !== '' && (
                    <span style={{
                      display: 'inline-block', width: 2, height: 14,
                      background: 'var(--accent)', marginLeft: 2,
                      animation: 'aiCursor 0.8s ease-in-out infinite',
                      verticalAlign: 'middle',
                    }} />
                  )}
                </div>
              </div>
            ))}

            {/* Suggestions (show only after first message if no conversation yet) */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s.msg} onClick={() => sendMessage(s.msg)} style={{
                    padding: '5px 10px',
                    borderRadius: 20,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text)'; }}
                  >{s.label}</button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Écris ton message... (Entrée pour envoyer)"
              rows={1}
              style={{
                flex: 1,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '9px 12px',
                color: 'var(--text)',
                fontSize: 13.5,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.4,
                maxHeight: 100,
                overflowY: 'auto',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: (loading || !input.trim()) ? 'var(--surface-2)' : 'linear-gradient(135deg, var(--accent), #00b386)',
                border: '1px solid var(--border)',
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {loading ? '⟳' : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
