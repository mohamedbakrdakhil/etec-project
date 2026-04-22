const db = require('../config/db');

// Auto-create table on module load
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS evaluations_seances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planning_id INT NOT NULL,
        etudiant_id INT NOT NULL,
        note INT NOT NULL CHECK (note BETWEEN 1 AND 10),
        commentaire TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_eval (planning_id, etudiant_id),
        FOREIGN KEY (planning_id) REFERENCES planning(id) ON DELETE CASCADE,
        FOREIGN KEY (etudiant_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.error('evaluationsController init:', err.message);
  }
})();

// POST /evaluations — etudiant rates a session
exports.addEvaluation = async (req, res) => {
  try {
    if (req.user.role !== 'etudiant') {
      return res.status(403).json({ message: 'Seuls les étudiants peuvent évaluer une séance.' });
    }

    const { planning_id, note, commentaire } = req.body;

    if (!planning_id || !note) {
      return res.status(400).json({ message: 'planning_id et note sont requis.' });
    }

    const noteInt = parseInt(note);
    if (isNaN(noteInt) || noteInt < 1 || noteInt > 10) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 10.' });
    }

    // Upsert: insert or update on duplicate key
    await db.query(`
      INSERT INTO evaluations_seances (planning_id, etudiant_id, note, commentaire)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE note = VALUES(note), commentaire = VALUES(commentaire)
    `, [planning_id, req.user.id, noteInt, commentaire || null]);

    res.status(201).json({ message: 'Évaluation enregistrée.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /evaluations/:planningId — admin/prof gets all ratings + avg
exports.getEvaluations = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'admin' && role !== 'developpeur' && role !== 'professeur') {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    const planningId = req.params.planningId;

    const [rows] = await db.query(`
      SELECT e.*, u.nom as etudiant_nom, u.prenom as etudiant_prenom
      FROM evaluations_seances e
      JOIN users u ON e.etudiant_id = u.id
      WHERE e.planning_id = ?
      ORDER BY e.created_at DESC
    `, [planningId]);

    const avgNote = rows.length > 0
      ? (rows.reduce((sum, r) => sum + r.note, 0) / rows.length).toFixed(1)
      : null;

    res.json({ evaluations: rows, avgNote, count: rows.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /evaluations/my/:planningId — student gets their own rating
exports.getMyEvaluation = async (req, res) => {
  try {
    const planningId = req.params.planningId;

    const [rows] = await db.query(
      'SELECT * FROM evaluations_seances WHERE planning_id = ? AND etudiant_id = ?',
      [planningId, req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ evaluation: null });
    }

    res.json({ evaluation: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
