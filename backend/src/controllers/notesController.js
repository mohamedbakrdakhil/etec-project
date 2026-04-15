const db = require('../config/db');

// Obtenir les notes (filtrées)
exports.getNotes = async (req, res) => {
  try {
    const { etudiant_id, module_id, groupe_id } = req.query;

    let query = `
      SELECT n.*, u.nom as etudiant_nom, u.prenom as etudiant_prenom,
             m.nom as module_nom, m.coefficient,
             s.nom as saisi_nom, s.prenom as saisi_prenom
      FROM notes n
      JOIN users u ON n.etudiant_id = u.id
      JOIN modules m ON n.module_id = m.id
      JOIN users s ON n.saisi_par = s.id
      WHERE 1=1
    `;
    const params = [];

    if (etudiant_id) { query += ' AND n.etudiant_id = ?'; params.push(etudiant_id); }
    if (module_id) { query += ' AND n.module_id = ?'; params.push(module_id); }

    if (groupe_id) {
      query += ' AND n.etudiant_id IN (SELECT etudiant_id FROM etudiants_groupes WHERE groupe_id = ?)';
      params.push(groupe_id);
    }

    // Si c'est un étudiant, il ne voit que ses notes
    if (req.user.role === 'etudiant') {
      query += ' AND n.etudiant_id = ?';
      params.push(req.user.id);
    }

    // Si c'est un prof, il ne voit que les notes de ses modules
    if (req.user.role === 'professeur') {
      query += ' AND n.module_id IN (SELECT module_id FROM enseignements WHERE professeur_id = ?)';
      params.push(req.user.id);
    }

    query += ' ORDER BY u.nom, u.prenom, m.nom';
    const [notes] = await db.query(query, params);

    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Ajouter une note
exports.addNote = async (req, res) => {
  try {
    const { etudiant_id, module_id, type_note, note, observation } = req.body;

    if (note < 0 || note > 20) {
      return res.status(400).json({ message: 'La note doit être entre 0 et 20.' });
    }

    // Vérifier si le prof enseigne ce module
    if (req.user.role === 'professeur') {
      const [ens] = await db.query(
        'SELECT id FROM enseignements WHERE professeur_id = ? AND module_id = ?',
        [req.user.id, module_id]
      );
      if (ens.length === 0) {
        return res.status(403).json({ message: 'Vous n\'enseignez pas ce module.' });
      }
    }

    // Vérifier si la note existe déjà
    const [existing] = await db.query(
      'SELECT id FROM notes WHERE etudiant_id = ? AND module_id = ? AND type_note = ?',
      [etudiant_id, module_id, type_note]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cette note existe déjà. Utilisez la modification.' });
    }

    const [result] = await db.query(
      'INSERT INTO notes (etudiant_id, module_id, type_note, note, observation, saisi_par) VALUES (?, ?, ?, ?, ?, ?)',
      [etudiant_id, module_id, type_note, note, observation, req.user.id]
    );

    res.status(201).json({ message: 'Note ajoutée.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Modifier une note
exports.updateNote = async (req, res) => {
  try {
    const { note, observation } = req.body;

    if (note < 0 || note > 20) {
      return res.status(400).json({ message: 'La note doit être entre 0 et 20.' });
    }

    // Vérifier droits du prof
    if (req.user.role === 'professeur') {
      const [n] = await db.query('SELECT module_id FROM notes WHERE id = ?', [req.params.id]);
      if (n.length === 0) return res.status(404).json({ message: 'Note non trouvée.' });
      
      const [ens] = await db.query(
        'SELECT id FROM enseignements WHERE professeur_id = ? AND module_id = ?',
        [req.user.id, n[0].module_id]
      );
      if (ens.length === 0) {
        return res.status(403).json({ message: 'Accès interdit.' });
      }
    }

    await db.query('UPDATE notes SET note = ?, observation = ? WHERE id = ?',
      [note, observation, req.params.id]);

    res.json({ message: 'Note modifiée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer une note
exports.deleteNote = async (req, res) => {
  try {
    await db.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Note supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir le bulletin d'un étudiant
exports.getBulletin = async (req, res) => {
  try {
    const etudiantId = req.params.etudiantId || req.user.id;

    // Si étudiant, il ne voit que son bulletin
    if (req.user.role === 'etudiant' && parseInt(etudiantId) !== req.user.id) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    const [etudiant] = await db.query(
      'SELECT id, nom, prenom, email FROM users WHERE id = ?', [etudiantId]
    );

    const [notes] = await db.query(`
      SELECT n.*, m.nom as module_nom, m.coefficient
      FROM notes n
      JOIN modules m ON n.module_id = m.id
      WHERE n.etudiant_id = ?
      ORDER BY m.nom, n.type_note
    `, [etudiantId]);

    // Calculer les moyennes par module
    const modulesMap = {};
    notes.forEach(n => {
      if (!modulesMap[n.module_id]) {
        modulesMap[n.module_id] = {
          module_nom: n.module_nom,
          coefficient: n.coefficient,
          notes: []
        };
      }
      modulesMap[n.module_id].notes.push({ type: n.type_note, note: parseFloat(n.note) });
    });

    const modules = Object.values(modulesMap).map(m => {
      const sum = m.notes.reduce((a, b) => a + b.note, 0);
      const moyenne = m.notes.length > 0 ? (sum / m.notes.length).toFixed(2) : null;
      return { ...m, moyenne: moyenne ? parseFloat(moyenne) : null };
    });

    // Moyenne générale
    let totalCoeff = 0, totalWeighted = 0;
    modules.forEach(m => {
      if (m.moyenne !== null) {
        totalWeighted += m.moyenne * m.coefficient;
        totalCoeff += m.coefficient;
      }
    });
    const moyenneGenerale = totalCoeff > 0 ? (totalWeighted / totalCoeff).toFixed(2) : null;

    res.json({
      etudiant: etudiant[0],
      modules,
      moyenneGenerale: moyenneGenerale ? parseFloat(moyenneGenerale) : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
