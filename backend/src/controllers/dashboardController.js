const db = require('../config/db');

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    const [totalProfs] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "professeur" AND is_active = TRUE');
    const [totalEtudiants] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "etudiant" AND is_active = TRUE');
    const [totalFilieres] = await db.query('SELECT COUNT(*) as count FROM filieres WHERE is_active = TRUE');
    const [totalGroupes] = await db.query('SELECT COUNT(*) as count FROM groupes');
    const [totalModules] = await db.query('SELECT COUNT(*) as count FROM modules');

    res.json({
      totalUsers: totalUsers[0].count,
      totalProfs: totalProfs[0].count,
      totalEtudiants: totalEtudiants[0].count,
      totalFilieres: totalFilieres[0].count,
      totalGroupes: totalGroupes[0].count,
      totalModules: totalModules[0].count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// System logs (developer only)
exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [logs] = await db.query(`
      SELECT sl.*, u.nom, u.prenom, u.role
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ORDER BY sl.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    const [total] = await db.query('SELECT COUNT(*) as count FROM system_logs');

    res.json({ logs, total: total[0].count });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Enseignements (affectation prof-module-groupe)
exports.getEnseignements = async (req, res) => {
  try {
    const [ens] = await db.query(`
      SELECT e.*, u.nom as prof_nom, u.prenom as prof_prenom,
             m.nom as module_nom, g.nom as groupe_nom, f.nom as filiere_nom
      FROM enseignements e
      JOIN users u ON e.professeur_id = u.id
      JOIN modules m ON e.module_id = m.id
      JOIN groupes g ON e.groupe_id = g.id
      JOIN filieres f ON g.filiere_id = f.id
      ORDER BY u.nom, m.nom
    `);
    res.json(ens);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.createEnseignement = async (req, res) => {
  try {
    const { professeur_id, module_id, groupe_id, annee_scolaire } = req.body;
    const [result] = await db.query(
      'INSERT INTO enseignements (professeur_id, module_id, groupe_id, annee_scolaire) VALUES (?, ?, ?, ?)',
      [professeur_id, module_id, groupe_id, annee_scolaire]
    );
    res.status(201).json({ message: 'Enseignement affecté.', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Cette affectation existe déjà.' });
    }
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.deleteEnseignement = async (req, res) => {
  try {
    await db.query('DELETE FROM enseignements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Enseignement supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Annonces
exports.getAnnonces = async (req, res) => {
  try {
    let query = `
      SELECT a.*, u.nom as publie_nom, u.prenom as publie_prenom
      FROM annonces a
      JOIN users u ON a.publie_par = u.id
      ORDER BY a.created_at DESC
    `;
    const [annonces] = await db.query(query);
    res.json(annonces);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.createAnnonce = async (req, res) => {
  try {
    const { titre, contenu, cible, groupe_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO annonces (titre, contenu, cible, groupe_id, publie_par) VALUES (?, ?, ?, ?, ?)',
      [titre, contenu, cible || 'tous', groupe_id, req.user.id]
    );
    res.status(201).json({ message: 'Annonce publiée.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.deleteAnnonce = async (req, res) => {
  try {
    await db.query('DELETE FROM annonces WHERE id = ?', [req.params.id]);
    res.json({ message: 'Annonce supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
