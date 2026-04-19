const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Login
exports.login = async (req, res) => {
  try {
    const email = (req.body.email || '').toString().trim().toLowerCase();
    const password = (req.body.password || '').toString();

    // Basic validation
    if (!email || !password) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log
    await db.query('INSERT INTO system_logs (user_id, action, ip_address) VALUES (?, ?, ?)', 
      [user.id, 'Connexion', req.ip]);

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        photo: user.photo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, nom, prenom, email, telephone, cin, adresse, photo, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }

    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

    const isMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);

    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
