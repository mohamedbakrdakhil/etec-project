const pool = require('../config/db');

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5'; // fast + cheap

const SYSTEM_PROMPT = `Tu es ETEC AI, l'assistant intelligent intégré dans le système de gestion scolaire ETEC FEZ (Maroc).

Tu aides les utilisateurs à naviguer, comprendre les données, et utiliser le système efficacement.
Réponds toujours en français, de façon concise et utile. Si l'utilisateur écrit en darija (ex: "chno", "bghit", "wach"), réponds en darija + français mélangé.

=== CONTEXTE SYSTÈME ===
ETEC FEZ est un établissement de formation professionnelle. Le système gère:
- Étudiants, groupes, filières
- Notes et bulletins
- Absences
- Planning des cours
- Paiements
- Professeurs et enseignements
- Annonces

=== NAVIGATION ===
Pour naviguer vers une page, ajoute à la FIN de ta réponse: [NAV:/chemin]

Pages selon le rôle:
DÉVELOPPEUR/ADMIN: /dev ou /admin + suffixe:
  /dashboard → Tableau de bord
  /users → Utilisateurs
  /groupes → Groupes
  /filieres → Filières
  /modules → Modules
  /notes → Notes
  /absences → Absences
  /planning → Planning
  /enseignements → Enseignements
  /paiements → Paiements
  /annonces → Annonces
  /logs → Journaux système

PROFESSEUR: /prof + suffixe:
  (index) → Mon espace
  /notes → Saisie notes
  /absences → Saisie absences
  /planning → Mon planning

ÉTUDIANT: /etudiant + suffixe:
  (index) → Mon espace
  /notes → Mon bulletin
  /absences → Mes absences
  /planning → Mon planning

=== RÈGLES ===
- Sois direct et concis (max 3 phrases sauf si plus requis)
- Si l'utilisateur veut aller quelque part → navigue directement avec [NAV:]
- Si l'utilisateur demande des stats → utilise les données DB fournies
- Termine TOUJOURS par une question utile ou suggestion d'action`;

// Smart fallback: rule-based responses when no API key
function smartFallback(message, role, stats) {
  const msg = message.toLowerCase();
  const base = role === 'developpeur' ? '/dev' : role === 'admin' ? '/admin' : role === 'professeur' ? '/prof' : '/etudiant';

  // Navigation intents
  if (/group|groupe/.test(msg)) return { text: `Voici la page Groupes — tu peux y créer des groupes et gérer les étudiants.`, nav: `${base}/groupes` };
  if (/etudiant|étudiant/.test(msg)) return { text: `Je t'emmène vers les utilisateurs — filtre par rôle "étudiant".`, nav: `${base}/users` };
  if (/note|bulletin|résultat|result/.test(msg)) return { text: `Direction la page Notes !`, nav: `${base}/notes` };
  if (/absence/.test(msg)) return { text: `Je t'emmène vers les absences.`, nav: `${base}/absences` };
  if (/planning|emploi|horaire/.test(msg)) return { text: `Voici le planning des cours.`, nav: `${base}/planning` };
  if (/paiement|payer|finance/.test(msg)) return { text: `Direction la gestion des paiements.`, nav: `${base}/paiements` };
  if (/filière|filiere/.test(msg)) return { text: `Voici les filières.`, nav: `${base}/filieres` };
  if (/module|matière|matiere/.test(msg)) return { text: `Direction les modules.`, nav: `${base}/modules` };
  if (/annonce|actualité/.test(msg)) return { text: `Voici les annonces.`, nav: `${base}/annonces` };
  if (/log|journal|activité/.test(msg) && role === 'developpeur') return { text: `Voici les journaux système.`, nav: `${base}/logs` };
  if (/user|utilisateur/.test(msg)) return { text: `Direction la gestion des utilisateurs.`, nav: `${base}/users` };
  if (/dashboard|accueil|home/.test(msg)) return { text: `Retour au tableau de bord !`, nav: base };

  // Stats questions
  if (/combien|nombre|stats|statistique/.test(msg)) {
    if (stats) {
      return {
        text: `📊 **Stats ETEC FEZ:**\n• ${stats.nb_etudiants || 0} étudiants\n• ${stats.nb_groupes || 0} groupes\n• ${stats.nb_profs || 0} professeurs\n• ${stats.nb_filieres || 0} filières\n\nQue veux-tu consulter ?`,
        nav: null
      };
    }
  }

  // Help
  if (/aide|help|comment|chno|bghit|kif/.test(msg)) {
    return {
      text: `Je peux t'aider à :\n• **Naviguer** → "va aux groupes", "montre les notes"\n• **Infos** → "combien d'étudiants ?"\n• **Aide** → "comment ajouter un étudiant ?"\n\nQue veux-tu faire ?`,
      nav: null
    };
  }

  return {
    text: `Je suis l'assistant ETEC AI 🎓\nDis-moi où tu veux aller ou ce que tu cherches — je m'en occupe !`,
    nav: null
  };
}

exports.chat = async (req, res) => {
  const { message, history = [], context = {} } = req.body;
  if (!message || typeof message !== 'string' || message.length > 500) {
    return res.status(400).json({ message: 'Message invalide' });
  }

  const userRole = req.user.role;
  const base = { developpeur: '/dev', admin: '/admin', professeur: '/prof', etudiant: '/etudiant' }[userRole] || '/';

  // Fetch DB stats for context
  let stats = null;
  let dbContext = '';
  try {
    const [rows] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role='etudiant') AS nb_etudiants,
        (SELECT COUNT(*) FROM users WHERE role='professeur') AS nb_profs,
        (SELECT COUNT(*) FROM groupes) AS nb_groupes,
        (SELECT COUNT(*) FROM filieres) AS nb_filieres,
        (SELECT COUNT(*) FROM modules) AS nb_modules
    `);
    stats = rows[0];
    dbContext = `\n=== DONNÉES ACTUELLES ===\nÉtudiants: ${stats.nb_etudiants} | Professeurs: ${stats.nb_profs} | Groupes: ${stats.nb_groupes} | Filières: ${stats.nb_filieres} | Modules: ${stats.nb_modules}`;
  } catch (e) { /* ignore DB errors */ }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // --- No API key: smart fallback ---
  if (!apiKey) {
    const fallback = smartFallback(message, userRole, stats);
    let navPath = null;
    if (fallback.nav) {
      navPath = fallback.nav.startsWith('/dev') || fallback.nav.startsWith('/admin') || fallback.nav.startsWith('/prof') || fallback.nav.startsWith('/etudiant')
        ? fallback.nav
        : base + fallback.nav;
    }
    return res.json({ response: fallback.text, action: navPath ? { type: 'navigate', path: navPath } : null });
  }

  // --- Streaming with Anthropic API ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering

  const systemPrompt = SYSTEM_PROMPT + dbContext + `\n\nRôle actuel: ${userRole} | Base URL: ${base} | Page: ${context.page || 'inconnue'}`;

  // Build messages (keep last 8 for context window)
  const safeHistory = (history || []).slice(-8).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content || '').slice(0, 1000),
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
        max_tokens: 600,
        stream: true,
        system: systemPrompt,
        messages: [...safeHistory, { role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      res.write(`data: ${JSON.stringify({ error: true, text: 'Service IA temporairement indisponible.' })}\n\n`);
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
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const chunk = parsed.delta.text || '';
            fullText += chunk;
            // Stream to client (hide [NAV:...] markers while streaming)
            const visibleChunk = chunk.replace(/\[NAV:[^\]]*\]/g, '');
            if (visibleChunk) {
              res.write(`data: ${JSON.stringify({ text: visibleChunk })}\n\n`);
            }
          }
        } catch (e) { /* malformed JSON chunk, skip */ }
      }
    }

    // Parse navigation action from full response
    const navMatch = fullText.match(/\[NAV:([^\]]+)\]/);
    let action = null;
    if (navMatch) {
      let path = navMatch[1].trim();
      // Ensure path is absolute
      if (!path.startsWith('/')) path = base + '/' + path;
      action = { type: 'navigate', path };
    }

    res.write(`data: ${JSON.stringify({ done: true, action })}\n\n`);
    res.end();

  } catch (err) {
    console.error('AI stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Erreur IA' });
    } else {
      res.write(`data: ${JSON.stringify({ error: true, text: 'Erreur de connexion au service IA.' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, action: null })}\n\n`);
      res.end();
    }
  }
};
