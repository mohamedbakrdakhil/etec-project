# 🎓 ETEC - Système de Gestion Scolaire

Système complet de gestion scolaire pour l'école technique ETEC.

## 📋 Fonctionnalités

### 4 Rôles :
| Rôle | Droits |
|------|--------|
| **Développeur** | Accès total : utilisateurs, filières, groupes, modules, notes, absences, planning, enseignements, annonces, logs système |
| **Admin** | Gestion des profs/étudiants, notes, absences, planning, filières, groupes, modules, annonces |
| **Professeur** | Saisie des notes + saisie des absences (appel) pour ses modules |
| **Étudiant** | Consultation de ses notes (bulletin) + ses absences + planning |

### Fonctionnalités principales :
- 🔐 Authentification JWT sécurisée
- 👥 Gestion des utilisateurs (CRUD complet)
- 🎓 Filières, Groupes, Modules
- 📝 Notes avec bulletin et moyennes automatiques
- 📅 Absences (individuel + appel en masse)
- 🕐 Planning avec vérification des conflits
- 🔗 Affectation des enseignements (prof → module → groupe)
- 📢 Annonces ciblées
- 🔍 Logs système (développeur)
- 📱 Interface responsive (mobile/desktop)

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- MySQL 8+

### 1. Base de données

Connectez-vous à MySQL (phpMyAdmin sur Hostinger) et exécutez le fichier :
```
backend/sql/database.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Éditez .env avec vos informations Hostinger MySQL
npm install
npm start
```

### 3. Frontend

```bash
cd frontend
npm install
npm run build
```

Le build sera dans `frontend/build/` — le backend le sert automatiquement.

---

## ⚙️ Configuration (.env)

```env
PORT=5000
NODE_ENV=production

# Hostinger MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=u_etec
DB_PASSWORD=votre_mot_de_passe
DB_NAME=etec_db

# JWT
JWT_SECRET=changez_cette_cle_secrete
JWT_EXPIRES_IN=24h
```

---

## 🌐 Déploiement sur Hostinger

### Option 1 : Hébergement Node.js (VPS)

1. Uploadez le projet sur le serveur
2. Configurez `.env` avec les infos MySQL Hostinger
3. Installez les dépendances : `npm install` (backend + frontend)
4. Build le frontend : `cd frontend && npm run build`
5. Lancez le serveur : `cd backend && npm start`
6. Utilisez PM2 pour garder le serveur actif : `pm2 start src/server.js --name etec`

### Option 2 : Hébergement Web (Shared)

1. Créez la base MySQL dans hPanel
2. Importez `database.sql` via phpMyAdmin
3. Configurez Node.js dans hPanel (si disponible)
4. Uploadez les fichiers via File Manager ou FTP

---

## 🔑 Compte par défaut

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| dev@etec.ma | admin123 | Développeur |

⚠️ **Changez ce mot de passe immédiatement en production !**

---

## 📁 Structure du projet

```
etec-project/
├── backend/
│   ├── sql/
│   │   └── database.sql          # Schema complet
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js             # Connexion MySQL
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT + autorisation
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── usersController.js
│   │   │   ├── notesController.js
│   │   │   ├── absencesController.js
│   │   │   ├── academicController.js
│   │   │   ├── planningController.js
│   │   │   └── dashboardController.js
│   │   ├── routes/
│   │   │   └── api.js            # Toutes les routes
│   │   └── server.js             # Point d'entrée
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── logo.png              # Logo ETEC
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js
│   │   │   ├── Modal.js
│   │   │   └── Sidebar.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Users.js
│   │   │   ├── Filieres.js
│   │   │   ├── Groupes.js
│   │   │   ├── Modules.js
│   │   │   ├── Notes.js
│   │   │   ├── Absences.js
│   │   │   ├── Planning.js
│   │   │   ├── Enseignements.js
│   │   │   ├── Annonces.js
│   │   │   ├── Logs.js
│   │   │   ├── ProfDashboard.js
│   │   │   ├── EtudiantDashboard.js
│   │   │   ├── EtudiantNotes.js
│   │   │   └── EtudiantAbsences.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

---

## 🎨 Thème

- **Bleu primaire** : `#0B4F6C`
- **Vert** : `#2E8B57`
- Basé sur les couleurs du logo ETEC

---

## 📞 Support

Développé pour ETEC - École Technique d'Excellence et de Compétences
