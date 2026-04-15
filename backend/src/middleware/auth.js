const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Vérifier le token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token manquant. Veuillez vous connecter.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query('SELECT id, nom, prenom, email, role, is_active FROM users WHERE id = ?', [decoded.id]);

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ message: 'Compte non trouvé ou désactivé.' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};

// Vérifier le rôle
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit. Vous n\'avez pas les droits nécessaires.' });
    }
    next();
  };
};

module.exports = { auth, authorize };
