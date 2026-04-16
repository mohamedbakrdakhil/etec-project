const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// Controllers
const authCtrl = require('../controllers/authController');
const usersCtrl = require('../controllers/usersController');
const notesCtrl = require('../controllers/notesController');
const absencesCtrl = require('../controllers/absencesController');
const academicCtrl = require('../controllers/academicController');
const planningCtrl = require('../controllers/planningController');
const dashboardCtrl = require('../controllers/dashboardController');

// Strict rate limiter for login (brute force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  skipSuccessfulRequests: true, // don't count successful logins
});

// ==================== AUTH ====================
router.post('/auth/login', loginLimiter, authCtrl.login);
router.get('/auth/profile', auth, authCtrl.getProfile);
router.put('/auth/password', auth, authCtrl.changePassword);

// ==================== USERS ====================
router.get('/users', auth, authorize('developpeur', 'admin'), usersCtrl.getUsers);
router.get('/users/:id', auth, authorize('developpeur', 'admin'), usersCtrl.getUserById);
router.post('/users', auth, authorize('developpeur', 'admin'), usersCtrl.createUser);
router.put('/users/:id', auth, authorize('developpeur', 'admin'), usersCtrl.updateUser);
router.delete('/users/:id', auth, authorize('developpeur', 'admin'), usersCtrl.deleteUser);
router.put('/users/:id/reset-password', auth, authorize('developpeur', 'admin'), usersCtrl.resetPassword);

// ==================== FILIÈRES ====================
router.get('/filieres', auth, academicCtrl.getFilieres);
router.post('/filieres', auth, authorize('developpeur', 'admin'), academicCtrl.createFiliere);
router.put('/filieres/:id', auth, authorize('developpeur', 'admin'), academicCtrl.updateFiliere);
router.delete('/filieres/:id', auth, authorize('developpeur', 'admin'), academicCtrl.deleteFiliere);

// ==================== GROUPES ====================
router.get('/groupes', auth, academicCtrl.getGroupes);
router.post('/groupes', auth, authorize('developpeur', 'admin'), academicCtrl.createGroupe);
router.put('/groupes/:id', auth, authorize('developpeur', 'admin'), academicCtrl.updateGroupe);
router.delete('/groupes/:id', auth, authorize('developpeur', 'admin'), academicCtrl.deleteGroupe);
router.get('/groupes/:id/etudiants', auth, academicCtrl.getGroupeStudents);
router.post('/groupes/:id/etudiants', auth, authorize('developpeur', 'admin'), academicCtrl.assignStudents);
router.delete('/groupes/:id/etudiants/:etudiantId', auth, authorize('developpeur', 'admin'), academicCtrl.removeStudentFromGroupe);

// ==================== MODULES ====================
router.get('/modules', auth, academicCtrl.getModules);
router.post('/modules', auth, authorize('developpeur', 'admin'), academicCtrl.createModule);
router.put('/modules/:id', auth, authorize('developpeur', 'admin'), academicCtrl.updateModule);
router.delete('/modules/:id', auth, authorize('developpeur', 'admin'), academicCtrl.deleteModule);

// ==================== NOTES ====================
router.get('/notes', auth, notesCtrl.getNotes);
router.post('/notes', auth, authorize('developpeur', 'admin', 'professeur'), notesCtrl.addNote);
router.put('/notes/:id', auth, authorize('developpeur', 'admin', 'professeur'), notesCtrl.updateNote);
router.delete('/notes/:id', auth, authorize('developpeur', 'admin'), notesCtrl.deleteNote);
router.get('/notes/bulletin/:etudiantId', auth, notesCtrl.getBulletin);
router.get('/notes/bulletin', auth, authorize('etudiant'), notesCtrl.getBulletin);

// ==================== ABSENCES ====================
router.get('/absences', auth, absencesCtrl.getAbsences);
router.post('/absences', auth, authorize('developpeur', 'admin', 'professeur'), absencesCtrl.addAbsence);
router.post('/absences/bulk', auth, authorize('developpeur', 'admin', 'professeur'), absencesCtrl.addBulkAbsences);
router.put('/absences/:id/justify', auth, authorize('developpeur', 'admin'), absencesCtrl.justifyAbsence);
router.delete('/absences/:id', auth, authorize('developpeur', 'admin'), absencesCtrl.deleteAbsence);
router.get('/absences/summary/:etudiantId', auth, absencesCtrl.getStudentAbsenceSummary);
router.get('/absences/summary', auth, authorize('etudiant'), absencesCtrl.getStudentAbsenceSummary);

// ==================== PLANNING ====================
router.get('/planning', auth, planningCtrl.getPlanning);
router.post('/planning', auth, authorize('developpeur', 'admin'), planningCtrl.addSeance);
router.put('/planning/:id', auth, authorize('developpeur', 'admin'), planningCtrl.updateSeance);
router.delete('/planning/:id', auth, authorize('developpeur', 'admin'), planningCtrl.deleteSeance);

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', auth, authorize('developpeur', 'admin'), dashboardCtrl.getDashboardStats);
router.get('/dashboard/logs', auth, authorize('developpeur'), dashboardCtrl.getLogs);

// ==================== ENSEIGNEMENTS ====================
router.get('/enseignements', auth, authorize('developpeur', 'admin'), dashboardCtrl.getEnseignements);
router.post('/enseignements', auth, authorize('developpeur', 'admin'), dashboardCtrl.createEnseignement);
router.delete('/enseignements/:id', auth, authorize('developpeur', 'admin'), dashboardCtrl.deleteEnseignement);

// ==================== ANNONCES ====================
router.get('/annonces', auth, dashboardCtrl.getAnnonces);
router.post('/annonces', auth, authorize('developpeur', 'admin'), dashboardCtrl.createAnnonce);
router.delete('/annonces/:id', auth, authorize('developpeur', 'admin'), dashboardCtrl.deleteAnnonce);

module.exports = router;
