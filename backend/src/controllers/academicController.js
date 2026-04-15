const db = require('../config/db');

// ==================== FILIÈRES ====================

exports.getFilieres = async (req, res) => {
  try {
    const [filieres] = await db.query('SELECT * FROM filieres WHERE is_active = TRUE ORDER BY nom');
    res.json(filieres);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.createFiliere = async (req, res) => {
  try {
    const { nom, description, duree_mois } = req.body;
    const [result] = await db.query(
      'INSERT INTO filieres (nom, description, duree_mois) VALUES (?, ?, ?)',
      [nom, description, duree_mois || 24]
    );
    res.status(201).json({ message: 'Filière créée.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateFiliere = async (req, res) => {
  try {
    const { nom, description, duree_mois, is_active } = req.body;
    await db.query(
      'UPDATE filieres SET nom=?, description=?, duree_mois=?, is_active=? WHERE id=?',
      [nom, description, duree_mois, is_active, req.params.id]
    );
    res.json({ message: 'Filière modifiée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.deleteFiliere = async (req, res) => {
  try {
    await db.query('UPDATE filieres SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Filière supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ==================== GROUPES ====================

exports.getGroupes = async (req, res) => {
  try {
    const { filiere_id } = req.query;
    let query = `
      SELECT g.*, f.nom as filiere_nom,
             (SELECT COUNT(*) FROM etudiants_groupes WHERE groupe_id = g.id) as nb_etudiants
      FROM groupes g
      JOIN filieres f ON g.filiere_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (filiere_id) { query += ' AND g.filiere_id = ?'; params.push(filiere_id); }

    query += ' ORDER BY g.annee_scolaire DESC, f.nom, g.nom';
    const [groupes] = await db.query(query, params);
    res.json(groupes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.createGroupe = async (req, res) => {
  try {
    const { nom, filiere_id, annee_scolaire } = req.body;
    const [result] = await db.query(
      'INSERT INTO groupes (nom, filiere_id, annee_scolaire) VALUES (?, ?, ?)',
      [nom, filiere_id, annee_scolaire]
    );
    res.status(201).json({ message: 'Groupe créé.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateGroupe = async (req, res) => {
  try {
    const { nom, filiere_id, annee_scolaire } = req.body;
    await db.query(
      'UPDATE groupes SET nom=?, filiere_id=?, annee_scolaire=? WHERE id=?',
      [nom, filiere_id, annee_scolaire, req.params.id]
    );
    res.json({ message: 'Groupe modifié.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.deleteGroupe = async (req, res) => {
  try {
    await db.query('DELETE FROM groupes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Groupe supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Affecter des étudiants à un groupe
exports.assignStudents = async (req, res) => {
  try {
    const { etudiant_ids } = req.body;
    const groupe_id = req.params.id;

    let added = 0;
    for (const eid of etudiant_ids) {
      const [existing] = await db.query(
        'SELECT id FROM etudiants_groupes WHERE etudiant_id = ? AND groupe_id = ?',
        [eid, groupe_id]
      );
      if (existing.length === 0) {
        await db.query('INSERT INTO etudiants_groupes (etudiant_id, groupe_id) VALUES (?, ?)', [eid, groupe_id]);
        added++;
      }
    }
    res.json({ message: `${added} étudiant(s) ajouté(s) au groupe.` });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir les étudiants d'un groupe
exports.getGroupeStudents = async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT u.id, u.nom, u.prenom, u.email, u.cin, eg.date_inscription
      FROM etudiants_groupes eg
      JOIN users u ON eg.etudiant_id = u.id
      WHERE eg.groupe_id = ?
      ORDER BY u.nom, u.prenom
    `, [req.params.id]);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Retirer un étudiant d'un groupe
exports.removeStudentFromGroupe = async (req, res) => {
  try {
    await db.query('DELETE FROM etudiants_groupes WHERE etudiant_id = ? AND groupe_id = ?',
      [req.params.etudiantId, req.params.id]);
    res.json({ message: 'Étudiant retiré du groupe.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ==================== MODULES ====================

exports.getModules = async (req, res) => {
  try {
    const { filiere_id } = req.query;
    let query = `
      SELECT m.*, f.nom as filiere_nom
      FROM modules m
      JOIN filieres f ON m.filiere_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (filiere_id) { query += ' AND m.filiere_id = ?'; params.push(filiere_id); }

    query += ' ORDER BY f.nom, m.nom';
    const [modules] = await db.query(query, params);
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.createModule = async (req, res) => {
  try {
    const { nom, code, coefficient, filiere_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO modules (nom, code, coefficient, filiere_id) VALUES (?, ?, ?, ?)',
      [nom, code, coefficient || 1.0, filiere_id]
    );
    res.status(201).json({ message: 'Module créé.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const { nom, code, coefficient, filiere_id } = req.body;
    await db.query(
      'UPDATE modules SET nom=?, code=?, coefficient=?, filiere_id=? WHERE id=?',
      [nom, code, coefficient, filiere_id, req.params.id]
    );
    res.json({ message: 'Module modifié.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    await db.query('DELETE FROM modules WHERE id = ?', [req.params.id]);
    res.json({ message: 'Module supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
