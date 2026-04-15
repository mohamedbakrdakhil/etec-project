const db = require('../config/db');

// Obtenir le planning
exports.getPlanning = async (req, res) => {
  try {
    const { groupe_id, professeur_id } = req.query;

    let query = `
      SELECT p.*, g.nom as groupe_nom, m.nom as module_nom,
             u.nom as prof_nom, u.prenom as prof_prenom,
             f.nom as filiere_nom
      FROM planning p
      JOIN groupes g ON p.groupe_id = g.id
      JOIN modules m ON p.module_id = m.id
      JOIN users u ON p.professeur_id = u.id
      JOIN filieres f ON g.filiere_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (groupe_id) { query += ' AND p.groupe_id = ?'; params.push(groupe_id); }
    if (professeur_id) { query += ' AND p.professeur_id = ?'; params.push(professeur_id); }

    // Étudiant: voir le planning de son groupe
    if (req.user.role === 'etudiant') {
      query += ' AND p.groupe_id IN (SELECT groupe_id FROM etudiants_groupes WHERE etudiant_id = ?)';
      params.push(req.user.id);
    }

    // Prof: voir son planning
    if (req.user.role === 'professeur') {
      query += ' AND p.professeur_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY FIELD(p.jour, "lundi","mardi","mercredi","jeudi","vendredi","samedi"), p.heure_debut';
    const [planning] = await db.query(query, params);

    res.json(planning);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Ajouter une séance
exports.addSeance = async (req, res) => {
  try {
    const { groupe_id, module_id, professeur_id, jour, heure_debut, heure_fin, salle } = req.body;

    // Vérifier conflit horaire pour le groupe
    const [conflitGroupe] = await db.query(`
      SELECT * FROM planning
      WHERE groupe_id = ? AND jour = ?
      AND ((heure_debut < ? AND heure_fin > ?) OR (heure_debut < ? AND heure_fin > ?) OR (heure_debut >= ? AND heure_fin <= ?))
    `, [groupe_id, jour, heure_fin, heure_debut, heure_fin, heure_debut, heure_debut, heure_fin]);

    if (conflitGroupe.length > 0) {
      return res.status(400).json({ message: 'Conflit horaire: le groupe a déjà un cours à cette heure.' });
    }

    // Vérifier conflit horaire pour le prof
    const [conflitProf] = await db.query(`
      SELECT * FROM planning
      WHERE professeur_id = ? AND jour = ?
      AND ((heure_debut < ? AND heure_fin > ?) OR (heure_debut < ? AND heure_fin > ?) OR (heure_debut >= ? AND heure_fin <= ?))
    `, [professeur_id, jour, heure_fin, heure_debut, heure_fin, heure_debut, heure_debut, heure_fin]);

    if (conflitProf.length > 0) {
      return res.status(400).json({ message: 'Conflit horaire: le professeur a déjà un cours à cette heure.' });
    }

    // Vérifier conflit salle
    if (salle) {
      const [conflitSalle] = await db.query(`
        SELECT * FROM planning
        WHERE salle = ? AND jour = ?
        AND ((heure_debut < ? AND heure_fin > ?) OR (heure_debut < ? AND heure_fin > ?) OR (heure_debut >= ? AND heure_fin <= ?))
      `, [salle, jour, heure_fin, heure_debut, heure_fin, heure_debut, heure_debut, heure_fin]);

      if (conflitSalle.length > 0) {
        return res.status(400).json({ message: `Conflit: la salle ${salle} est déjà occupée.` });
      }
    }

    const [result] = await db.query(
      'INSERT INTO planning (groupe_id, module_id, professeur_id, jour, heure_debut, heure_fin, salle) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [groupe_id, module_id, professeur_id, jour, heure_debut, heure_fin, salle]
    );

    res.status(201).json({ message: 'Séance ajoutée.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Modifier une séance
exports.updateSeance = async (req, res) => {
  try {
    const { groupe_id, module_id, professeur_id, jour, heure_debut, heure_fin, salle } = req.body;

    await db.query(
      'UPDATE planning SET groupe_id=?, module_id=?, professeur_id=?, jour=?, heure_debut=?, heure_fin=?, salle=? WHERE id=?',
      [groupe_id, module_id, professeur_id, jour, heure_debut, heure_fin, salle, req.params.id]
    );

    res.json({ message: 'Séance modifiée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer une séance
exports.deleteSeance = async (req, res) => {
  try {
    await db.query('DELETE FROM planning WHERE id = ?', [req.params.id]);
    res.json({ message: 'Séance supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
