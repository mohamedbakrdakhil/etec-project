const pool = require('../config/db');

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5';

const DAYS_FR = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function nowContext() {
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return {
    greeting,
    jour: DAYS_FR[now.getDay()],
    heure: `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`,
    date: `${now.getDate()} ${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`,
  };
}

// ── Fetch rich live context ────────────────────────────────────────────────
async function fetchLiveContext(userRole, userId) {
  const ctx = {};
  const now = nowContext();
  ctx.now = now;

  try {
    // Base stats
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role='etudiant') AS nb_etudiants,
        (SELECT COUNT(*) FROM users WHERE role='professeur') AS nb_profs,
        (SELECT COUNT(*) FROM groupes) AS nb_groupes,
        (SELECT COUNT(*) FROM filieres) AS nb_filieres,
        (SELECT COUNT(*) FROM absences WHERE DATE(date_absence) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) AS absences_semaine,
        (SELECT COUNT(*) FROM absences WHERE DATE(date_absence) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS absences_mois
    `);
    ctx.stats = stats;

    // Today's sessions
    const [sessions] = await pool.query(`
      SELECT p.heure_debut, p.heure_fin, p.salle,
             m.nom AS module_nom, g.nom AS groupe_nom,
             CONCAT(u.prenom, ' ', u.nom) AS prof_nom,
             COALESCE(p.statut, 'actif') AS statut
      FROM planning p
      LEFT JOIN modules m ON p.module_id = m.id
      LEFT JOIN groupes g ON p.groupe_id = g.id
      LEFT JOIN users u ON p.professeur_id = u.id
      WHERE p.jour = ?
      ORDER BY p.heure_debut
      LIMIT 10
    `, [now.jour]);
    ctx.sessionsAujourd = sessions;

    // Top absents (last 30 days)
    const [topAbsents] = await pool.query(`
      SELECT CONCAT(u.prenom, ' ', u.nom) AS nom, COUNT(*) AS nb,
             g.nom AS groupe
      FROM absences a
      JOIN users u ON a.etudiant_id = u.id
      LEFT JOIN groupes g ON u.id IN (SELECT etudiant_id FROM groupe_etudiants WHERE groupe_id = g.id)
      WHERE a.date_absence >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY a.etudiant_id
      ORDER BY nb DESC
      LIMIT 5
    `);
    ctx.topAbsents = topAbsents;

    // Role-specific context
    if (userRole === 'etudiant') {
      // Student's own absences
      const [myAbsences] = await pool.query(`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN justifiee=1 THEN 1 ELSE 0 END) AS justifiees
        FROM absences WHERE etudiant_id = ?
      `, [userId]);
      ctx.myAbsences = myAbsences[0];

      // Student's latest notes
      const [myNotes] = await pool.query(`
        SELECT m.nom AS module_nom, n.note, n.type_evaluation
        FROM notes n
        JOIN modules m ON n.module_id = m.id
        WHERE n.etudiant_id = ?
        ORDER BY n.created_at DESC LIMIT 5
      `, [userId]);
      ctx.myNotes = myNotes;

      // Student's group
      const [[myGroup]] = await pool.query(`
        SELECT g.nom AS groupe, f.nom AS filiere
        FROM groupe_etudiants ge
        JOIN groupes g ON ge.groupe_id = g.id
        LEFT JOIN filieres f ON g.filiere_id = f.id
        WHERE ge.etudiant_id = ?
        LIMIT 1
      `, [userId]).catch(() => [[null]]);
      ctx.myGroup = myGroup;

    } else if (userRole === 'professeur') {
      // Prof's sessions today
      const [mySessions] = await pool.query(`
        SELECT p.heure_debut, p.heure_fin, p.salle,
               m.nom AS module_nom, g.nom AS groupe_nom,
               COALESCE(p.statut, 'actif') AS statut
        FROM planning p
        LEFT JOIN modules m ON p.module_id = m.id
        LEFT JOIN groupes g ON p.groupe_id = g.id
        WHERE p.professeur_id = ? AND p.jour = ?
        ORDER BY p.heure_debut
      `, [userId, now.jour]);
      ctx.mySessions = mySessions;

      // Prof's modules
      const [myModules] = await pool.query(`
        SELECT DISTINCT m.nom
        FROM planning p
        JOIN modules m ON p.module_id = m.id
        WHERE p.professeur_id = ?
      `, [userId]);
      ctx.myModules = myModules;
    }

    // Recent announcements
    const [annonces] = await pool.query(`
      SELECT titre, contenu, created_at FROM annonces
      ORDER BY created_at DESC LIMIT 3
    `).catch(() => [[]]);
    ctx.annonces = annonces;

  } catch (e) {
    console.error('fetchLiveContext error:', e.message);
  }

  return ctx;
}

// ── Build system prompt ────────────────────────────────────────────────────
function buildSystemPrompt(userRole, userName, base, ctx) {
  const { now, stats, sessionsAujourd, topAbsents, myAbsences, myNotes, myGroup, mySessions, myModules, annonces } = ctx;

  const sessionsText = sessionsAujourd?.length
    ? sessionsAujourd.map(s => `  • ${s.heure_debut?.slice(0,5)}-${s.heure_fin?.slice(0,5)} | ${s.module_nom} | ${s.groupe_nom} | ${s.prof_nom}${s.statut==='annulé' ? ' [ANNULÉ]' : ''}`).join('\n')
    : '  Aucune séance aujourd\'hui';

  const topAbsentsText = topAbsents?.length
    ? topAbsents.map(a => `  • ${a.nom}: ${a.nb} absences`).join('\n')
    : '  Aucune absence récente';

  let roleSpecific = '';
  if (userRole === 'etudiant') {
    roleSpecific = `
=== TON PROFIL (ÉTUDIANT) ===
Groupe: ${myGroup?.groupe || 'Non assigné'} | Filière: ${myGroup?.filiere || 'N/A'}
Tes absences: ${myAbsences?.total || 0} total (${myAbsences?.justifiees || 0} justifiées)
Tes dernières notes: ${myNotes?.length ? myNotes.map(n => `${n.module_nom}: ${n.note}/20`).join(', ') : 'Aucune note encore'}`;

  } else if (userRole === 'professeur') {
    roleSpecific = `
=== TON PROFIL (PROFESSEUR) ===
Tes séances aujourd'hui (${now.jour}):
${mySessions?.length ? mySessions.map(s => `  • ${s.heure_debut?.slice(0,5)}-${s.heure_fin?.slice(0,5)} | ${s.module_nom} | ${s.groupe_nom}${s.statut==='annulé' ? ' [ANNULÉ]' : ''}`).join('\n') : '  Aucune séance'}
Tes modules: ${myModules?.map(m => m.nom).join(', ') || 'Non assigné'}`;
  }

  return `Tu es ETEC AI ✨, l'assistant IA magique de l'ETEC FEZ (Maroc) — un établissement de formation professionnelle.

Tu parles à: ${userName} (rôle: ${userRole})
Date: ${now.date} | Jour: ${now.jour} | Heure: ${now.heure}
${now.greeting} ${userName.split(' ')[0]} !

=== DONNÉES LIVE DU SYSTÈME ===
👥 Étudiants: ${stats?.nb_etudiants || 0} | 👨‍🏫 Profs: ${stats?.nb_profs || 0} | 📋 Groupes: ${stats?.nb_groupes || 0} | 🎓 Filières: ${stats?.nb_filieres || 0}
📅 Absences: ${stats?.absences_semaine || 0} cette semaine | ${stats?.absences_mois || 0} ce mois

=== PLANNING AUJOURD'HUI (${now.jour.toUpperCase()}) ===
${sessionsText}

=== TOP 5 ABSENTS (30 jours) ===
${topAbsentsText}
${roleSpecific}

=== ANNONCES RÉCENTES ===
${annonces?.length ? annonces.map(a => `  • ${a.titre}`).join('\n') : '  Aucune annonce'}

=== NAVIGATION (utilise à la FIN de ta réponse si nécessaire) ===
Format: [NAV:/chemin]
Routes ${userRole === 'developpeur' || userRole === 'admin' ? `${base}` : base}:
${userRole === 'developpeur' || userRole === 'admin' ? `
  /users, /filieres, /groupes, /notes, /absences, /planning, /enseignements, /paiements, /annonces${userRole === 'developpeur' ? ', /logs' : ''}` :
  userRole === 'professeur' ? `
  /notes (saisie), /absences (saisie), /planning (mon planning)` :
  `
  /notes (mon bulletin), /absences (mes absences), /planning (mon planning), /paiements`
}

=== STYLE DE RÉPONSE ===
- Réponds TOUJOURS en français (ou darija+français si l'utilisateur écrit en darija)
- Sois concis (2-4 phrases max sauf pour les données détaillées)
- Utilise des émojis pour rendre les réponses visuelles
- Pour les listes: commence par "•"
- Pour les données importantes: utilise **texte** pour mettre en gras
- Si tu donnes des stats, sois précis avec les chiffres réels fournis ci-dessus
- Ne mentionne JAMAIS de choses que tu n'as pas dans ton contexte
- Si l'utilisateur veut naviguer quelque part → TOUJOURS ajouter [NAV:/chemin] à la fin
- Sois proactif: propose des actions utiles basées sur le contexte`;
}

// ── Smart fallback ─────────────────────────────────────────────────────────
function smartFallback(message, userRole, base, ctx) {
  const msg = message.toLowerCase();
  const stats = ctx.stats || {};
  const now = ctx.now || {};

  if (/groupe/.test(msg)) return { text: `Je t'emmène vers les groupes 📋`, nav: `${base}/groupes` };
  if (/étudiant|etudiant/.test(msg)) return { text: `Direction les utilisateurs — filtre "étudiant" 👥`, nav: `${base}/users` };
  if (/note|bulletin/.test(msg)) return { text: `Voici la page Notes 📝`, nav: `${base}/notes` };
  if (/absence/.test(msg)) return { text: `Direction Absences 📅`, nav: `${base}/absences` };
  if (/planning|emploi|séance/.test(msg)) return { text: `Voici le planning des cours 🗓️`, nav: `${base}/planning` };
  if (/paiement/.test(msg)) return { text: `Direction Paiements 💰`, nav: `${base}/paiements` };
  if (/filière|filiere/.test(msg)) return { text: `Voici les filières 🎓`, nav: `${base}/filieres` };
  if (/annonce/.test(msg)) return { text: `Direction les annonces 📢`, nav: `${base}/annonces` };
  if (/log|journal/.test(msg) && userRole === 'developpeur') return { text: `Voici les logs système 🔍`, nav: `${base}/logs` };
  if (/user|utilisateur/.test(msg)) return { text: `Direction les utilisateurs 👥`, nav: `${base}/users` };
  if (/dashboard|accueil/.test(msg)) return { text: `Retour au dashboard 📊`, nav: base };

  if (/combien|stats|statistique|nombre/.test(msg)) {
    const sessText = ctx.sessionsAujourd?.length
      ? `• Séances aujourd'hui (${now.jour}): **${ctx.sessionsAujourd.length}**`
      : '• Aucune séance aujourd\'hui';
    return {
      text: `📊 **Stats ETEC FEZ en temps réel:**\n• Étudiants: **${stats.nb_etudiants || 0}**\n• Professeurs: **${stats.nb_profs || 0}**\n• Groupes: **${stats.nb_groupes || 0}**\n• Filières: **${stats.nb_filieres || 0}**\n• Absences cette semaine: **${stats.absences_semaine || 0}**\n${sessText}\n\nQue veux-tu consulter ?`,
      nav: null
    };
  }

  if (/planning|aujourd|aujourd'hui|séance/.test(msg)) {
    const s = ctx.sessionsAujourd || [];
    if (s.length === 0) return { text: `Aucune séance programmée aujourd'hui (${now.jour}) 📭`, nav: null };
    const list = s.map(x => `• ${x.heure_debut?.slice(0,5)} — ${x.module_nom} (${x.groupe_nom})`).join('\n');
    return { text: `📅 **Séances aujourd'hui (${now.jour}):**\n${list}`, nav: null };
  }

  return {
    text: `Salam ! Je suis **ETEC AI** ✨\nJe connais les données live du système — stats, planning, absences.\nDis-moi ce que tu veux faire !`,
    nav: null
  };
}

// ── Main handler ───────────────────────────────────────────────────────────
exports.chat = async (req, res) => {
  const { message, history = [], context = {} } = req.body;
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ message: 'Message invalide' });
  }

  const userRole = req.user.role;
  const userId = req.user.id;
  const userName = `${req.user.prenom || ''} ${req.user.nom || ''}`.trim() || 'Utilisateur';
  const base = { developpeur: '/dev', admin: '/admin', professeur: '/prof', etudiant: '/etudiant' }[userRole] || '/';

  // Fetch live context
  const liveCtx = await fetchLiveContext(userRole, userId);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // --- No API key: smart fallback ---
  if (!apiKey) {
    const fallback = smartFallback(message, userRole, base, liveCtx);
    return res.json({
      response: fallback.text,
      action: fallback.nav ? { type: 'navigate', path: fallback.nav } : null,
      context: { sessionsCount: liveCtx.sessionsAujourd?.length || 0 }
    });
  }

  // --- Streaming ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const systemPrompt = buildSystemPrompt(userRole, userName, base, liveCtx);

  const safeHistory = (history || []).slice(-10).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content || '').slice(0, 800),
  }));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        stream: true,
        system: systemPrompt,
        messages: [...safeHistory, { role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      res.write(`data: ${JSON.stringify({ error: true, text: '⚠️ Service IA indisponible.' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, action: null })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const chunk = parsed.delta.text || '';
            fullText += chunk;
            // Hide markers while streaming
            const visibleChunk = chunk.replace(/\[NAV:[^\]]*\]/g, '');
            if (visibleChunk) {
              res.write(`data: ${JSON.stringify({ text: visibleChunk })}\n\n`);
            }
          }
        } catch (e) { /* skip */ }
      }
    }

    // Parse action
    const navMatch = fullText.match(/\[NAV:([^\]]+)\]/);
    let action = null;
    if (navMatch) {
      let path = navMatch[1].trim();
      if (!path.startsWith('/')) path = base + '/' + path;
      action = { type: 'navigate', path };
    }

    // Send live context alongside done event (for the frontend to show smart cards)
    const livePayload = {
      sessionsToday: liveCtx.sessionsAujourd?.slice(0, 3) || [],
      stats: liveCtx.stats,
      jour: liveCtx.now?.jour,
    };

    res.write(`data: ${JSON.stringify({ done: true, action, live: livePayload })}\n\n`);
    res.end();

  } catch (err) {
    console.error('AI stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Erreur IA' });
    } else {
      res.write(`data: ${JSON.stringify({ error: true, text: '⚠️ Erreur de connexion.' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, action: null })}\n\n`);
      res.end();
    }
  }
};
