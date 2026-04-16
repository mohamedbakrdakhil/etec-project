const db = require('../config/db');

// Lister les paiements
exports.getPaiements = async (req, res) => {
  try {
    const { etudiant_id, search, page = 1 } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*,
        u.nom AS etudiant_nom, u.prenom AS etudiant_prenom, u.cin AS etudiant_cin,
        s.nom AS saisi_par_nom, s.prenom AS saisi_par_prenom
      FROM paiements p
      JOIN users u ON p.etudiant_id = u.id
      JOIN users s ON p.saisi_par = s.id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) as total FROM paiements p JOIN users u ON p.etudiant_id = u.id WHERE 1=1`;
    const params = [];
    const countParams = [];

    if (etudiant_id) {
      query += ' AND p.etudiant_id = ?';
      countQuery += ' AND p.etudiant_id = ?';
      params.push(etudiant_id);
      countParams.push(etudiant_id);
    }

    if (search) {
      query += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.cin LIKE ?)';
      countQuery += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.cin LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
      countParams.push(s, s, s);
    }

    query += ' ORDER BY p.date_paiement DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [paiements] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      paiements,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Résumé paiements par étudiant
exports.getSummaryByEtudiant = async (req, res) => {
  try {
    const { search, groupe_id } = req.query;

    let query = `
      SELECT
        u.id, u.nom, u.prenom, u.cin,
        g.nom AS groupe_nom,
        COALESCE(SUM(p.montant), 0) AS total_paye,
        COUNT(p.id) AS nb_paiements
      FROM users u
      LEFT JOIN etudiants_groupes eg ON u.id = eg.etudiant_id
      LEFT JOIN groupes g ON eg.groupe_id = g.id
      LEFT JOIN paiements p ON u.id = p.etudiant_id
      WHERE u.role = 'etudiant' AND u.is_active = TRUE
    `;
    const params = [];

    if (groupe_id) {
      query += ' AND eg.groupe_id = ?';
      params.push(groupe_id);
    }

    if (search) {
      query += ' AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.cin LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' GROUP BY u.id, u.nom, u.prenom, u.cin, g.nom ORDER BY u.nom ASC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Paiements d'un étudiant spécifique
exports.getPaiementsEtudiant = async (req, res) => {
  try {
    const { etudiantId } = req.params;
    const [paiements] = await db.query(
      `SELECT p.*, s.nom AS saisi_par_nom, s.prenom AS saisi_par_prenom
       FROM paiements p
       JOIN users s ON p.saisi_par = s.id
       WHERE p.etudiant_id = ?
       ORDER BY p.date_paiement DESC`,
      [etudiantId]
    );
    res.json(paiements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Ajouter un paiement
exports.addPaiement = async (req, res) => {
  try {
    const { etudiant_id, montant, date_paiement, type_paiement, mois, methode, observation } = req.body;

    if (!etudiant_id || !montant || !date_paiement) {
      return res.status(400).json({ message: 'Étudiant, montant et date sont obligatoires.' });
    }

    if (isNaN(montant) || parseFloat(montant) <= 0) {
      return res.status(400).json({ message: 'Le montant doit être un nombre positif.' });
    }

    const [result] = await db.query(
      `INSERT INTO paiements (etudiant_id, montant, date_paiement, type_paiement, mois, methode, observation, saisi_par)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [etudiant_id, parseFloat(montant), date_paiement, type_paiement || 'mensualite', mois || null, methode || 'especes', observation || null, req.user.id]
    );

    await db.query('INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Ajout paiement', `Étudiant ID: ${etudiant_id}, Montant: ${montant} DH`]);

    res.status(201).json({ message: 'Paiement enregistré.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Modifier un paiement
exports.updatePaiement = async (req, res) => {
  try {
    const { montant, date_paiement, type_paiement, mois, methode, observation } = req.body;

    if (isNaN(montant) || parseFloat(montant) <= 0) {
      return res.status(400).json({ message: 'Le montant doit être un nombre positif.' });
    }

    await db.query(
      `UPDATE paiements SET montant=?, date_paiement=?, type_paiement=?, mois=?, methode=?, observation=? WHERE id=?`,
      [parseFloat(montant), date_paiement, type_paiement, mois || null, methode, observation || null, req.params.id]
    );

    res.json({ message: 'Paiement modifié.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer un paiement
exports.deletePaiement = async (req, res) => {
  try {
    await db.query('DELETE FROM paiements WHERE id = ?', [req.params.id]);
    await db.query('INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Suppression paiement', `ID: ${req.params.id}`]);
    res.json({ message: 'Paiement supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
