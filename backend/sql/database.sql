-- =============================================
-- ETEC - Base de données complète
-- =============================================

CREATE DATABASE IF NOT EXISTS etec_db;
USE etec_db;

-- =============================================
-- Table des utilisateurs (tous les rôles)
-- =============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    cin VARCHAR(20) UNIQUE,
    adresse TEXT,
    photo VARCHAR(255),
    role ENUM('developpeur', 'admin', 'professeur', 'etudiant') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- Table des filières
-- =============================================
CREATE TABLE filieres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    duree_mois INT DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Table des groupes
-- =============================================
CREATE TABLE groupes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    filiere_id INT NOT NULL,
    annee_scolaire VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
);

-- =============================================
-- Table des modules (matières)
-- =============================================
CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE,
    coefficient DECIMAL(3,1) DEFAULT 1.0,
    filiere_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE
);

-- =============================================
-- Affectation étudiant -> groupe
-- =============================================
CREATE TABLE etudiants_groupes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    groupe_id INT NOT NULL,
    date_inscription DATE DEFAULT (CURRENT_DATE),
    UNIQUE KEY unique_etudiant_groupe (etudiant_id, groupe_id),
    FOREIGN KEY (etudiant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE
);

-- =============================================
-- Affectation professeur -> module -> groupe
-- =============================================
CREATE TABLE enseignements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professeur_id INT NOT NULL,
    module_id INT NOT NULL,
    groupe_id INT NOT NULL,
    annee_scolaire VARCHAR(20) NOT NULL,
    UNIQUE KEY unique_enseignement (professeur_id, module_id, groupe_id, annee_scolaire),
    FOREIGN KEY (professeur_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE
);

-- =============================================
-- Table des notes
-- =============================================
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    module_id INT NOT NULL,
    type_note ENUM('controle1', 'controle2', 'controle3', 'examen_fin_module', 'tp', 'projet') NOT NULL,
    note DECIMAL(5,2) NOT NULL CHECK (note >= 0 AND note <= 20),
    observation TEXT,
    date_saisie DATE DEFAULT (CURRENT_DATE),
    saisi_par INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (saisi_par) REFERENCES users(id)
);

-- =============================================
-- Table des absences
-- =============================================
CREATE TABLE absences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    module_id INT NOT NULL,
    date_absence DATE NOT NULL,
    seance ENUM('s1', 's2', 's3', 's4') NOT NULL,
    justifiee BOOLEAN DEFAULT FALSE,
    motif TEXT,
    saisi_par INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (saisi_par) REFERENCES users(id)
);

-- =============================================
-- Table du planning (emploi du temps)
-- =============================================
CREATE TABLE planning (
    id INT AUTO_INCREMENT PRIMARY KEY,
    groupe_id INT NOT NULL,
    module_id INT NOT NULL,
    professeur_id INT NOT NULL,
    jour ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi') NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    salle VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (professeur_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- Table des annonces
-- =============================================
CREATE TABLE annonces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    cible ENUM('tous', 'professeurs', 'etudiants') DEFAULT 'tous',
    groupe_id INT,
    publie_par INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE SET NULL,
    FOREIGN KEY (publie_par) REFERENCES users(id)
);

-- =============================================
-- Logs système (pour le développeur)
-- =============================================
CREATE TABLE system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- Compte développeur par défaut
-- password: admin123 (hash bcrypt)
-- =============================================
INSERT INTO users (nom, prenom, email, password, role) VALUES
('ETEC', 'Développeur', 'dev@etec.ma', '$2b$10$XvQ3RCJxKXFXfX0xGVKj5eJL8.GQ1LZrHdPY1JwLKZvKFmVXxXq6i', 'developpeur');
