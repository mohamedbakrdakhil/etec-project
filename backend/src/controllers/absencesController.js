const db = require('../config/db');

// Auto-create absences_profs table on module load
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS absences_profs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        professeur_id INT NOT NULL,
        date_absence DATE NOT NULL,
        motif TEXT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (professeur_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
  } catch (err) {
    console.error('absencesController init (absences_profs):', err.message);
  }
})();

// Obtenir les absences
exports.getAbsences = async (req, res) => {
  try {
    const { etudiant_id, module_id, groupe_id, date_debut, date_fin } = req.query;

    let query = `
      SELECT a.*, u.nom as etudiant_nom, u.prenom as etudiant_prenom,
             m.nom as module_nom,
             s.nom as saisi_nom, s.prenom as saisi_prenom
      FROM absences a
      JOIN users u ON a.etudiant_id = u.id
      JOIN modules m ON a.module_id = m.id
      JOIN users s ON a.saisi_par = s.id
      WHERE 1=1
    `;
    const params = [];

    if (etudiant_id) { query += ' AND a.etudiant_id = ?'; params.push(etudiant_id); }
    if (module_id) { query += ' AND a.module_id = ?'; params.push(module_id); }
    if (date_debut) { query += ' AND a.date_absence >= ?'; params.push(date_debut); }
    if (date_fin) { query += ' AND a.date_absence <= ?'; params.push(date_fin); }

    if (groupe_id) {
      query += ' AND a.etudiant_id IN (SELECT etudiant_id FROM etudiants_groupes WHERE groupe_id = ?)';
      params.push(groupe_id);
    }

    // Étudiant ne voit que ses absences
    if (req.user.role === 'etudiant') {
      query += ' AND a.etudiant_id = ?';
      params.push(req.user.id);
    }

    // Prof ne voit que ses modules
    if (req.user.role === 'professeur') {
      query += ' AND a.module_id IN (SELECT module_id FROM enseignements WHERE professeur_id = ?)';
      params.push(req.user.id);
    }

    query += ' ORDER BY a.date_absence DESC, u.nom';
    const [absences] = await db.query(query, params);

    res.json(absences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Ajouter une absence
exports.addAbsence = async (req, res) => {
  try {
    const { etudiant_id, module_id, date_absence, seance, motif } = req.body;

    // Vérifier droits du prof
    if (req.user.role === 'professeur') {
      const [ens] = await db.query(
        'SELECT id FROM enseignements WHERE professeur_id = ? AND module_id = ?',
        [req.user.id, module_id]
      );
      if (ens.length === 0) {
        return res.status(403).json({ message: 'Vous n\'enseignez pas ce module.' });
      }
    }

    // Vérifier doublon
    const [existing] = await db.query(
      'SELECT id FROM absences WHERE etudiant_id = ? AND module_id = ? AND date_absence = ? AND seance = ?',
      [etudiant_id, module_id, date_absence, seance]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cette absence est déjà enregistrée.' });
    }

    const [result] = await db.query(
      'INSERT INTO absences (etudiant_id, module_id, date_absence, seance, motif, saisi_par) VALUES (?, ?, ?, ?, ?, ?)',
      [etudiant_id, module_id, date_absence, seance, motif, req.user.id]
    );

    res.status(201).json({ message: 'Absence enregistrée.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Marquer absence en masse (pour un groupe)
exports.addBulkAbsences = async (req, res) => {
  try {
    const { absents, module_id, date_absence, seance } = req.body;
    // absents = array d'etudiant_id

    if (!absents || absents.length === 0) {
      return res.status(400).json({ message: 'Aucun étudiant sélectionné.' });
    }

    let added = 0;
    for (const etudiant_id of absents) {
      const [existing] = await db.query(
        'SELECT id FROM absences WHERE etudiant_id = ? AND module_id = ? AND date_absence = ? AND seance = ?',
        [etudiant_id, module_id, date_absence, seance]
      );
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO absences (etudiant_id, module_id, date_absence, seance, saisi_par) VALUES (?, ?, ?, ?, ?)',
          [etudiant_id, module_id, date_absence, seance, req.user.id]
        );
        added++;
      }
    }

    res.status(201).json({ message: `${added} absence(s) enregistrée(s).` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Justifier une absence
exports.justifyAbsence = async (req, res) => {
  try {
    const { motif } = req.body;
    await db.query('UPDATE absences SET justifiee = TRUE, motif = ? WHERE id = ?',
      [motif, req.params.id]);
    res.json({ message: 'Absence justifiée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer une absence
exports.deleteAbsence = async (req, res) => {
  try {
    await db.query('DELETE FROM absences WHERE id = ?', [req.params.id]);
    res.json({ message: 'Absence supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ==================== ABSENCES PROFESSEURS ====================

// POST /absences/profs — admin/dev marks prof absent
exports.addAbsenceProf = async (req, res) => {
  try {
    const { professeur_id, date_absence, motif } = req.body;

    if (!professeur_id || !date_absence) {
      return res.status(400).json({ message: 'professeur_id et date_absence sont requis.' });
    }

    const [result] = await db.query(
      'INSERT INTO absences_profs (professeur_id, date_absence, motif, created_by) VALUES (?, ?, ?, ?)',
      [professeur_id, date_absence, motif || null, req.user.id]
    );

    res.status(201).json({ message: 'Absence professeur enregistrée.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /absences/profs — list all prof absences with prof name
exports.getAbsencesProfs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ap.*, u.nom as prof_nom, u.prenom as prof_prenom,
             c.nom as created_by_nom, c.prenom as created_by_prenom
      FROM absences_profs ap
      JOIN users u ON ap.professeur_id = u.id
      JOIN users c ON ap.created_by = c.id
      ORDER BY ap.date_absence DESC, u.nom
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /absences/profs/:id
exports.deleteAbsenceProf = async (req, res) => {
  try {
    await db.query('DELETE FROM absences_profs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Absence professeur supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Résumé des absences d'un étudiant
exports.getStudentAbsenceSummary = async (req, res) => {
  try {
    const etudiantId = req.params.etudiantId || req.user.id;

    if (req.user.role === 'etudiant' && parseInt(etudiantId) !== req.user.id) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    const [summary] = await db.query(`
      SELECT m.nom as module_nom,
             COUNT(*) as total_absences,
             SUM(CASE WHEN a.justifiee = TRUE THEN 1 ELSE 0 END) as justifiees,
             SUM(CASE WHEN a.justifiee = FALSE THEN 1 ELSE 0 END) as non_justifiees
      FROM absences a
      JOIN modules m ON a.module_id = m.id
      WHERE a.etudiant_id = ?
      GROUP BY a.module_id, m.nom
      ORDER BY total_absences DESC
    `, [etudiantId]);

    const [total] = await db.query(
      'SELECT COUNT(*) as total FROM absences WHERE etudiant_id = ?', [etudiantId]
    );

    res.json({ summary, totalAbsences: total[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
