import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

// ── Color palette ─────────────────────────────────────────────────────────
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

// ── Constants ─────────────────────────────────────────────────────────────
const TODAY_DAY = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][new Date().getDay()];
const JOURS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const JOURS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam'];
const HEURES = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
const EMPTY_FORM = { groupe_id:'', module_id:'', professeur_id:'', jour:'lundi', heure_debut:'08:30', heure_fin:'11:00', salle:'' };

// Grid geometry
const START_H = 8;
const END_H = 18;
const GRID_H = 700;
const timeToPx = (timeStr) => {
  const [h, m] = (timeStr || '08:00').split(':').map(Number);
  return ((h + m / 60 - START_H) / (END_H - START_H)) * GRID_H;
};
const heightPx = (start, end) => {
  const s = timeToPx(start);
  const e = timeToPx(end);
  return Math.max(e - s, 42);
};

// ── Global styles injected once ───────────────────────────────────────────
const STYLES = `
  @keyframes p3d-float {
    0%,100% { transform: translateY(0) rotateZ(0deg); }
    33% { transform: translateY(-8px) rotateZ(1deg); }
    66% { transform: translateY(-4px) rotateZ(-1deg); }
  }
  @keyframes p3d-rise {
    0%   { opacity:0; transform:translateY(0) scale(1); }
    10%  { opacity:1; }
    90%  { opacity:0.5; }
    100% { opacity:0; transform:translateY(-500px) scale(0.2); }
  }
  @keyframes p3d-slide-in {
    from { opacity:0; transform:translateY(20px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes p3d-glow-pulse {
    0%,100% { opacity:0.4; }
    50%     { opacity:0.9; }
  }
  @keyframes p3d-time-line {
    0%,100% { opacity:0.7; box-shadow: 0 0 6px #EF4444; }
    50%     { opacity:1;   box-shadow: 0 0 16px #EF4444, 0 0 32px rgba(239,68,68,0.4); }
  }
  @keyframes p3d-shimmer {
    from { transform: translateX(-150%); }
    to   { transform: translateX(250%); }
  }
  @keyframes p3d-bounce-in {
    0%   { transform: scale(0.6) rotate(-8deg); opacity:0; }
    60%  { transform: scale(1.15) rotate(3deg); opacity:1; }
    80%  { transform: scale(0.95) rotate(-1deg); }
    100% { transform: scale(1) rotate(0); }
  }
  @keyframes p3d-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .p3d-card {
    position: absolute;
    left: 6px;
    right: 6px;
    border-radius: 14px;
    padding: 10px 12px;
    cursor: pointer;
    transition: box-shadow 0.2s ease;
    transform-style: preserve-3d;
    will-change: transform;
    overflow: hidden;
    animation: p3d-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .p3d-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%);
    transform: translateX(-150%);
    border-radius: 14px;
    pointer-events: none;
  }
  .p3d-card:hover::before {
    animation: p3d-shimmer 0.7s ease forwards;
  }
  .p3d-card.cancelled {
    filter: grayscale(0.7);
    opacity: 0.65;
  }

  .p3d-hour-label {
    position: absolute;
    right: 6px;
    transform: translateY(-50%);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
  }
  .p3d-hour-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border);
    opacity: 0.5;
  }
  .p3d-day-col {
    position: relative;
    border-radius: 16px;
    border: 1px solid var(--border);
    overflow: hidden;
    backdrop-filter: blur(4px);
    transition: border-color 0.3s, box-shadow 0.3s;
    animation: p3d-slide-in 0.4s ease both;
  }
  .p3d-day-col.today {
    border: 1.5px solid rgba(16,185,129,0.5);
    box-shadow: 0 0 0 3px rgba(16,185,129,0.08), inset 0 0 40px rgba(16,185,129,0.04);
  }

  .p3d-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10.5px;
    font-weight: 600;
    padding: 4px 9px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
    backdrop-filter: blur(4px);
  }
  .p3d-action-btn:hover {
    transform: scale(1.08) translateY(-1px);
  }

  .p3d-rating-btn {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
    border: 2px solid var(--border);
    background: var(--surface-2);
    color: var(--text);
  }
  .p3d-rating-btn:hover {
    transform: scale(1.18) translateY(-3px);
    box-shadow: 0 8px 20px rgba(245,158,11,0.35);
    background: #F59E0B;
    border-color: #F59E0B;
    color: white;
  }
  .p3d-rating-btn.selected {
    background: #F59E0B;
    border-color: #F59E0B;
    color: white;
    transform: scale(1.12);
    box-shadow: 0 6px 18px rgba(245,158,11,0.4);
    animation: p3d-bounce-in 0.35s ease;
  }
`;

let injected = false;
const injectStyles = () => {
  if (injected) return;
  injected = true;
  const el = document.createElement('style');
  el.textContent = STYLES;
  document.head.appendChild(el);
};

// ── useTilt hook ──────────────────────────────────────────────────────────
const useTilt = () => {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -10;
    const ry = ((x - cx) / cx) * 10;
    const gx = (x / rect.width) * 100;
    const gy = (y / rect.height) * 100;
    setTilt({ rx, ry, gx, gy });
  }, []);

  const onLeave = useCallback(() => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 }), []);

  return { ref, tilt, onMove, onLeave };
};

// ── Floating particles ────────────────────────────────────────────────────
const Particles = () => {
  const pts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 4,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    dur: 7 + Math.random() * 9,
    op: 0.06 + Math.random() * 0.1,
  }));
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position:'absolute', bottom:-10, left:`${p.left}%`,
          width:p.size, height:p.size, borderRadius:'50%',
          background:'var(--accent)', opacity:p.op,
          animation:`p3d-rise ${p.dur}s ease-in ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
};

// ── SessionCard (3D tilt) ─────────────────────────────────────────────────
const SessionCard = ({ p, isAdmin, isEtudiant, onEdit, onCancel, onRestore, onDelete, onRate, myEval, sessionEval, style }) => {
  const { ref, tilt, onMove, onLeave } = useTilt();
  const color = getColor(p.module_nom);
  const rgb = hexToRgb(color);
  const cancelled = p.statut === 'annulé';
  const jourIndex = JOURS.indexOf(p.jour);
  const todayIndex = JOURS.indexOf(TODAY_DAY);
  const isPast = jourIndex <= todayIndex;

  const top = timeToPx(p.heure_debut?.slice(0,5) || '08:00');
  const h = heightPx(p.heure_debut?.slice(0,5) || '08:00', p.heure_fin?.slice(0,5) || '09:00');

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`p3d-card${cancelled ? ' cancelled' : ''}`}
      style={{
        top,
        height: h,
        background: cancelled
          ? 'rgba(100,100,100,0.08)'
          : `linear-gradient(135deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.08) 100%)`,
        border: `1px solid rgba(${rgb},${cancelled ? 0.15 : 0.35})`,
        borderLeft: cancelled ? `3px solid #9CA3AF` : `3px solid ${color}`,
        boxShadow: cancelled ? 'none' : `0 4px 20px rgba(${rgb},0.2), inset 0 1px 0 rgba(255,255,255,0.08)`,
        transform: `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        backgroundImage: cancelled ? undefined : `
          linear-gradient(135deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.06) 100%),
          radial-gradient(ellipse at ${tilt.gx}% ${tilt.gy}%, rgba(${rgb},0.25) 0%, transparent 70%)
        `,
        ...style,
      }}
    >
      {/* Glow orb that follows mouse */}
      {!cancelled && (
        <div style={{
          position:'absolute',
          width:80, height:80,
          borderRadius:'50%',
          background:`radial-gradient(circle, rgba(${rgb},0.35) 0%, transparent 70%)`,
          left:`${tilt.gx}%`, top:`${tilt.gy}%`,
          transform:'translate(-50%,-50%)',
          pointerEvents:'none',
          transition:'left 0.05s, top 0.05s',
          zIndex:0,
        }} />
      )}

      <div style={{ position:'relative', zIndex:1 }}>
        {/* Module */}
        <div style={{
          fontWeight:800, fontSize:12,
          color: cancelled ? '#9CA3AF' : color,
          marginBottom:2,
          textDecoration: cancelled ? 'line-through' : 'none',
          textShadow: cancelled ? 'none' : `0 0 12px rgba(${rgb},0.5)`,
          letterSpacing:'0.02em',
        }}>
          {p.module_nom}
        </div>

        {/* Time pill */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:4,
          background:`rgba(${rgb},0.15)`,
          border:`1px solid rgba(${rgb},0.25)`,
          borderRadius:20, padding:'1px 7px',
          fontSize:10.5, fontWeight:700,
          color: cancelled ? '#9CA3AF' : color,
          marginBottom:4,
        }}>
          🕐 {p.heure_debut?.slice(0,5)} – {p.heure_fin?.slice(0,5)}
        </div>

        {/* Prof */}
        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>
          👨‍🏫 {p.prof_prenom} {p.prof_nom}
        </div>

        {/* Group + Salle */}
        {p.groupe_nom && (
          <div style={{ fontSize:10.5, color:'var(--text-muted)' }}>
            👥 {p.groupe_nom}{p.salle ? ` · 📍${p.salle}` : ''}
          </div>
        )}

        {/* Badges */}
        {cancelled && (
          <div style={{
            display:'inline-block', marginTop:4,
            background:'rgba(156,163,175,0.15)', color:'#9CA3AF',
            border:'1px solid rgba(156,163,175,0.3)',
            borderRadius:20, fontSize:9, fontWeight:800, padding:'2px 8px',
            letterSpacing:'0.05em',
          }}>ANNULÉ</div>
        )}
        {myEval && (
          <div style={{
            display:'inline-block', marginTop:4, marginLeft:4,
            background:'rgba(245,158,11,0.15)', color:'#F59E0B',
            border:'1px solid rgba(245,158,11,0.3)',
            borderRadius:20, fontSize:9, fontWeight:800, padding:'2px 8px',
          }}>⭐ {myEval.note}/10</div>
        )}
        {sessionEval && sessionEval.count > 0 && !isEtudiant && (
          <div style={{
            display:'inline-block', marginTop:4, marginLeft:4,
            background:'rgba(245,158,11,0.12)', color:'#F59E0B',
            border:'1px solid rgba(245,158,11,0.25)',
            borderRadius:20, fontSize:9, fontWeight:700, padding:'2px 7px',
          }}>★ {parseFloat(sessionEval.avgNote).toFixed(1)} ({sessionEval.count})</div>
        )}

        {/* Actions */}
        {h > 70 && (
          <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
            {isAdmin && (
              <>
                <ActionBtn icon="✏️" label="Modifier" color="#0EA5E9" onClick={() => onEdit(p)} />
                {cancelled
                  ? <ActionBtn icon="▶" label="Restaurer" color="#10B981" onClick={() => onRestore(p.id)} />
                  : <ActionBtn icon="⏸" label="Annuler" color="#F59E0B" onClick={() => onCancel(p.id)} />
                }
                <ActionBtn icon="🗑️" label="" color="#EF4444" onClick={() => onDelete(p.id)} />
              </>
            )}
            {isEtudiant && isPast && !cancelled && !myEval && (
              <ActionBtn icon="⭐" label="Évaluer" color="#F59E0B" onClick={() => onRate(p)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── ActionBtn ─────────────────────────────────────────────────────────────
const ActionBtn = ({ icon, label, color, onClick }) => {
  const [h, setH] = useState(false);
  const rgb = hexToRgb(color);
  return (
    <button
      className="p3d-action-btn"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        background: h ? `rgba(${rgb},0.18)` : `rgba(${rgb},0.08)`,
        borderColor: h ? `rgba(${rgb},0.5)` : `rgba(${rgb},0.25)`,
        color: h ? color : 'var(--text-muted)',
        boxShadow: h ? `0 4px 12px rgba(${rgb},0.25)` : 'none',
      }}
    >
      {icon}{label && <span>{label}</span>}
    </button>
  );
};

// ── Day column ─────────────────────────────────────────────────────────────
const DayColumn = ({ jour, sessions, isToday, isAdmin, isEtudiant, myEvals, sessionEvals, onEdit, onCancel, onRestore, onDelete, onRate, index }) => {
  const dayModules = [...new Set(sessions.map(s => s.module_nom))];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Day header */}
      <div style={{
        padding:'10px 12px',
        borderRadius:'16px 16px 0 0',
        textAlign:'center',
        background: isToday
          ? 'linear-gradient(135deg, #10B981, #06D6A0)'
          : 'var(--surface-2)',
        border:`1px solid ${isToday ? '#10B981' : 'var(--border)'}`,
        borderBottom:'none',
        animation:`p3d-slide-in 0.4s ease ${index * 0.06}s both`,
      }}>
        <div style={{
          fontWeight:800, fontSize:13,
          color: isToday ? 'white' : 'var(--text)',
          textTransform:'capitalize',
          textShadow: isToday ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
        }}>
          {isToday ? '☀️ ' : ''}{JOURS_SHORT[JOURS.indexOf(jour)]}
        </div>
        <div style={{ fontSize:10, color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', marginTop:1, textTransform:'capitalize' }}>
          {jour}
        </div>
        {/* Module dots */}
        {dayModules.length > 0 && (
          <div style={{ display:'flex', justifyContent:'center', gap:3, marginTop:5, flexWrap:'wrap' }}>
            {dayModules.slice(0,4).map((m, i) => (
              <div key={i} style={{
                width:6, height:6, borderRadius:'50%',
                background: getColor(m),
                boxShadow:`0 0 4px ${getColor(m)}`,
              }} />
            ))}
            {dayModules.length > 4 && (
              <div style={{ fontSize:9, color:'var(--text-muted)', fontWeight:600 }}>+{dayModules.length-4}</div>
            )}
          </div>
        )}
      </div>

      {/* Column body */}
      <div
        className={`p3d-day-col${isToday ? ' today' : ''}`}
        style={{
          height: GRID_H,
          borderRadius:'0 0 16px 16px',
          animation:`p3d-slide-in 0.45s ease ${index * 0.07 + 0.05}s both`,
        }}
      >
        {/* Hour grid lines */}
        {[8,9,10,11,12,13,14,15,16,17].map(h => (
          <React.Fragment key={h}>
            <div className="p3d-hour-line" style={{ top: timeToPx(`${h}:00`) }} />
          </React.Fragment>
        ))}

        {/* Empty state */}
        {sessions.length === 0 && (
          <div style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexDirection:'column', gap:6, color:'var(--text-muted)',
            fontSize:12, opacity:0.5,
          }}>
            <div style={{ fontSize:24 }}>📭</div>
            <div>Libre</div>
          </div>
        )}

        {/* Sessions */}
        {sessions.map(p => (
          <SessionCard
            key={p.id}
            p={p}
            isAdmin={isAdmin}
            isEtudiant={isEtudiant}
            onEdit={onEdit}
            onCancel={onCancel}
            onRestore={onRestore}
            onDelete={onDelete}
            onRate={onRate}
            myEval={myEvals[p.id] || null}
            sessionEval={sessionEvals[p.id] || null}
          />
        ))}

        {/* Today's current time line */}
        {isToday && <CurrentTimeLine />}
      </div>
    </div>
  );
};

// ── Current time red line ─────────────────────────────────────────────────
const CurrentTimeLine = () => {
  const [top, setTop] = useState(null);
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h >= START_H && h < END_H) {
        setTop(timeToPx(`${h}:${m < 10 ? '0' : ''}${m}`));
      }
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  if (top === null) return null;
  return (
    <div style={{ position:'absolute', left:0, right:0, top, zIndex:10, pointerEvents:'none' }}>
      <div style={{
        position:'absolute', left:0, right:0, height:2,
        background:'linear-gradient(90deg, transparent, #EF4444, transparent)',
        animation:'p3d-time-line 2s ease-in-out infinite',
      }} />
      <div style={{
        position:'absolute', left:4, top:-4,
        width:8, height:8, borderRadius:'50%',
        background:'#EF4444',
        boxShadow:'0 0 8px #EF4444',
        animation:'p3d-glow-pulse 2s ease-in-out infinite',
      }} />
    </div>
  );
};

// ── SeanceFormFields ──────────────────────────────────────────────────────
const SeanceFormFields = ({ f, setF, groupes, modules, profs }) => (
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
    {/* Day pills */}
    <div className="form-group">
      <label>Jour *</label>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
        {JOURS.map(j => (
          <button
            key={j}
            type="button"
            onClick={() => setF({ ...f, jour: j })}
            style={{
              padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700,
              cursor:'pointer', transition:'all 0.2s',
              background: f.jour === j ? 'var(--accent)' : 'var(--surface-2)',
              border: `1.5px solid ${f.jour === j ? 'var(--accent)' : 'var(--border)'}`,
              color: f.jour === j ? 'white' : 'var(--text)',
              transform: f.jour === j ? 'scale(1.05)' : 'scale(1)',
              textTransform:'capitalize',
            }}
          >
            {j}
          </button>
        ))}
      </div>
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

// ── Main Planning Component ───────────────────────────────────────────────
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
  const [loading, setLoading] = useState(true);

  const [myEvals, setMyEvals] = useState({});
  const [sessionEvals, setSessionEvals] = useState({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

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
    if (!items?.length) return;
    if (isEtudiant) {
      const entries = await Promise.all(
        items.map(async (p) => {
          try {
            const r = await api.get(`/evaluations/my/${p.id}`);
            return [p.id, r.data.evaluation];
          } catch { return [p.id, null]; }
        })
      );
      const map = {};
      entries.forEach(([id, ev]) => { if (ev) map[id] = ev; });
      setMyEvals(map);
    } else if (isAdmin) {
      const entries = await Promise.all(
        items.map(async (p) => {
          try {
            const r = await api.get(`/evaluations/${p.id}`);
            return [p.id, { avgNote: r.data.avgNote, count: r.data.count }];
          } catch { return [p.id, null]; }
        })
      );
      const map = {};
      entries.forEach(([id, ev]) => { if (ev && ev.count > 0) map[id] = ev; });
      setSessionEvals(map);
    }
  }, [isEtudiant, isAdmin]);

  useEffect(() => {
    setLoading(true);
    fetchPlanning().then(items => {
      fetchEvaluations(items);
      setLoading(false);
    });
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

  const handleAdd = async () => {
    try {
      await api.post('/planning', form);
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      refresh();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleEdit = (p) => {
    setEditItem(p);
    setEditForm({
      groupe_id: p.groupe_id, module_id: p.module_id, professeur_id: p.professeur_id,
      jour: p.jour, heure_debut: p.heure_debut?.slice(0,5), heure_fin: p.heure_fin?.slice(0,5), salle: p.salle || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/planning/${editItem.id}`, editForm);
      setShowEditModal(false);
      setEditItem(null);
      refresh();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Annuler cette séance ?')) return;
    try { await api.patch(`/planning/${id}/cancel`); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleRestore = async (id) => {
    try { await api.patch(`/planning/${id}/restore`); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette séance définitivement ?')) return;
    try { await api.delete(`/planning/${id}`); refresh(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const openRateModal = (p) => { setRateItem(p); setRateNote(null); setRateComment(''); };

  const handleSubmitRating = async () => {
    if (!rateNote) return alert('Veuillez sélectionner une note.');
    setRateSaving(true);
    try {
      await api.post('/evaluations', { planning_id: rateItem.id, note: rateNote, commentaire: rateComment });
      setRateItem(null);
      refresh();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
    setRateSaving(false);
  };

  // Group by day
  const planningByDay = {};
  JOURS.forEach(j => {
    planningByDay[j] = planning
      .filter(p => p.jour === j)
      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));
  });

  // Unique modules for legend
  const allModules = [...new Map(planning.map(p => [p.module_nom, p])).values()];

  // Hour labels for sidebar
  const hourLabels = [8,9,10,11,12,13,14,15,16,17,18];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:44, height:44, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'p3d-spin 0.8s linear infinite' }} />
      <p style={{ color:'var(--text-muted)', fontSize:14 }}>Chargement du planning...</p>
    </div>
  );

  return (
    <div style={{ position:'relative' }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg, rgba(6,214,160,0.08) 0%, rgba(124,58,237,0.06) 50%, rgba(14,165,233,0.08) 100%)',
        border:'1px solid var(--border)',
        borderRadius:20, padding:'24px 28px',
        marginBottom:24,
      }}>
        <Particles />
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
              <div style={{
                width:48, height:48, borderRadius:14,
                background:'linear-gradient(135deg, rgba(6,214,160,0.2), rgba(14,165,233,0.2))',
                border:'1px solid rgba(6,214,160,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:24, animation:'p3d-float 4s ease-in-out infinite',
              }}>🗓️</div>
              <div>
                <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'var(--text)' }}>
                  {readOnly ? 'Mon Planning' : 'Planning des Séances'}
                </h2>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
                  Semaine en cours · {planning.length} séance{planning.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            {/* Today badge */}
            {TODAY_DAY && (
              <div style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:20,
                background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)',
              }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', animation:'p3d-glow-pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:12, fontWeight:700, color:'#10B981', textTransform:'capitalize' }}>
                  Aujourd'hui: {TODAY_DAY}
                </span>
              </div>
            )}

            {/* Group filter */}
            <select
              className="form-control"
              style={{ width:'auto', minWidth:160, fontSize:13 }}
              value={filterGroupe}
              onChange={e => setFilterGroupe(e.target.value)}
            >
              <option value="">Tous les groupes</option>
              {groupes.map(g => (
                <option key={g.id} value={g.id}>{g.nom}{g.filiere_nom ? ` — ${g.filiere_nom}` : ''}</option>
              ))}
            </select>

            {/* Add button */}
            {isAdmin && (
              <button
                className="btn btn-primary"
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'10px 20px', borderRadius:12, fontWeight:700,
                  background:'linear-gradient(135deg, var(--accent), #0EA5E9)',
                  border:'none', fontSize:13,
                  boxShadow:'0 4px 15px rgba(6,214,160,0.35)',
                  transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onClick={() => { setForm(EMPTY_FORM); setShowAddModal(true); }}
              >
                <span style={{ fontSize:18 }}>+</span> Ajouter Séance
              </button>
            )}
          </div>
        </div>

        {/* Module legend */}
        {allModules.length > 0 && (
          <div style={{
            position:'relative', zIndex:1,
            display:'flex', gap:8, flexWrap:'wrap', marginTop:16,
            padding:'10px 0 0',
            borderTop:'1px solid var(--border)',
          }}>
            {allModules.map((p, i) => {
              const c = getColor(p.module_nom);
              const rgb = hexToRgb(c);
              return (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'3px 10px', borderRadius:20,
                  background:`rgba(${rgb},0.1)`,
                  border:`1px solid rgba(${rgb},0.25)`,
                  fontSize:11, fontWeight:600, color:c,
                  animation:`p3d-slide-in 0.3s ease ${i*0.04}s both`,
                }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:c, boxShadow:`0 0 4px ${c}` }} />
                  {p.module_nom}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3D CALENDAR GRID ── */}
      <div style={{
        background:'var(--surface)',
        border:'1px solid var(--border)',
        borderRadius:20,
        padding:'20px',
        overflow:'auto',
      }}>
        <div style={{ display:'flex', gap:0, minWidth:900 }}>

          {/* Hour sidebar */}
          <div style={{ width:52, flexShrink:0, position:'relative', height:GRID_H, marginTop:90 }}>
            {hourLabels.map(h => (
              <div key={h} className="p3d-hour-label" style={{ top: timeToPx(`${h}:00`) }}>
                {h}h
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${JOURS.length}, 1fr)`,
            gap:8,
            flex:1,
          }}>
            {JOURS.map((j, idx) => (
              <DayColumn
                key={j}
                jour={j}
                sessions={planningByDay[j] || []}
                isToday={j === TODAY_DAY}
                isAdmin={isAdmin}
                isEtudiant={isEtudiant}
                myEvals={myEvals}
                sessionEvals={sessionEvals}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onRestore={handleRestore}
                onDelete={handleDelete}
                onRate={openRateModal}
                index={idx}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── ADD MODAL ── */}
      {isAdmin && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="✨ Ajouter une Séance"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleAdd}>Enregistrer</button>
            </>
          }
        >
          <SeanceFormFields f={form} setF={setForm} groupes={groupes} modules={modules} profs={profs} />
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {isAdmin && editItem && (
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditItem(null); }}
          title="✏️ Modifier la Séance"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Enregistrer</button>
            </>
          }
        >
          <SeanceFormFields f={editForm} setF={setEditForm} groupes={groupes} modules={modules} profs={profs} />
        </Modal>
      )}

      {/* ── RATING MODAL ── */}
      {isEtudiant && rateItem && (
        <Modal
          isOpen={true}
          onClose={() => setRateItem(null)}
          title={`⭐ Évaluer — ${rateItem.module_nom}`}
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setRateItem(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSubmitRating} disabled={rateSaving || !rateNote}>
                {rateSaving ? 'Enregistrement...' : 'Soumettre'}
              </button>
            </>
          }
        >
          <div style={{
            padding:'10px 14px', borderRadius:12, marginBottom:16,
            background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)',
            fontSize:13, color:'var(--text-muted)',
          }}>
            🕐 {rateItem.heure_debut?.slice(0,5)} – {rateItem.heure_fin?.slice(0,5)}
            {rateItem.groupe_nom && ` · 👥 ${rateItem.groupe_nom}`}
            {rateItem.salle && ` · 📍 ${rateItem.salle}`}
          </div>

          <div className="form-group">
            <label style={{ fontWeight:700, marginBottom:10, display:'block', fontSize:13 }}>
              Note — 1 = mauvais · 10 = excellent
            </label>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  className={`p3d-rating-btn${rateNote === n ? ' selected' : ''}`}
                  onClick={() => setRateNote(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            {rateNote && (
              <div style={{
                marginTop:12, padding:'8px 14px', borderRadius:10,
                background: rateNote >= 7 ? 'rgba(16,185,129,0.1)' : rateNote >= 4 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                border:`1px solid ${rateNote >= 7 ? 'rgba(16,185,129,0.3)' : rateNote >= 4 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: rateNote >= 7 ? '#10B981' : rateNote >= 4 ? '#F59E0B' : '#EF4444',
                fontSize:13, fontWeight:700, textAlign:'center',
                animation:'p3d-bounce-in 0.3s ease',
              }}>
                {rateNote >= 8 ? '🌟 Excellent !' : rateNote >= 6 ? '👍 Bien' : rateNote >= 4 ? '😐 Moyen' : '👎 À améliorer'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Commentaire (optionnel)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Votre avis sur cette séance..."
              value={rateComment}
              onChange={e => setRateComment(e.target.value)}
              style={{ resize:'vertical' }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Planning;
