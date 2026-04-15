const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Lister les utilisateurs (avec filtres)
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, nom, prenom, email, telephone, cin, role, is_active, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];

    // Développeur voit tout, Admin ne voit pas les développeurs
    if (req.user.role === 'admin') {
      query += ' AND role != ?';
      countQuery += ' AND role != ?';
      params.push('developpeur');
      countParams.push('developpeur');
    }

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
      countParams.push(role);
    }

    if (search) {
      query += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR cin LIKE ?)';
      countQuery += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR cin LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
      countParams.push(s, s, s, s);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      users,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, nom, prenom, email, telephone, cin, adresse, photo, role, is_active, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, cin, adresse, role } = req.body;

    // Vérifier que l'admin ne crée pas de développeur
    if (req.user.role === 'admin' && role === 'developpeur') {
      return res.status(403).json({ message: 'Vous ne pouvez pas créer un compte développeur.' });
    }

    // Vérifier email unique
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hash = await bcrypt.hash(password || 'etec2024', 10);

    const [result] = await db.query(
      'INSERT INTO users (nom, prenom, email, password, telephone, cin, adresse, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, prenom, email, hash, telephone, cin, adresse, role]
    );

    // Log
    await db.query('INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Création utilisateur', `${role}: ${nom} ${prenom} (${email})`]);

    res.status(201).json({ message: 'Utilisateur créé avec succès.', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Modifier un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, cin, adresse, role, is_active } = req.body;
    const userId = req.params.id;

    // Vérifier que l'utilisateur existe
    const [existing] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Admin ne peut pas modifier un développeur
    if (req.user.role === 'admin' && existing[0].role === 'developpeur') {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    await db.query(
      'UPDATE users SET nom=?, prenom=?, email=?, telephone=?, cin=?, adresse=?, role=?, is_active=? WHERE id=?',
      [nom, prenom, email, telephone, cin, adresse, role, is_active, userId]
    );

    // Log
    await db.query('INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Modification utilisateur', `ID: ${userId}`]);

    res.json({ message: 'Utilisateur modifié avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer un utilisateur (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const [existing] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    if (req.user.role === 'admin' && existing[0].role === 'developpeur') {
      return res.status(403).json({ message: 'Accès interdit.' });
    }

    await db.query('UPDATE users SET is_active = FALSE WHERE id = ?', [userId]);

    // Log
    await db.query('INSERT INTO system_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'Suppression utilisateur', `ID: ${userId}`]);

    res.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Reset mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const hash = await bcrypt.hash(newPassword || 'etec2024', 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.params.id]);
    res.json({ message: 'Mot de passe réinitialisé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
