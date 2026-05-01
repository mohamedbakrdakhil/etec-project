# ETEC Fès — Application Mobile

Application mobile de gestion scolaire pour l'École des Techniques Économiques et Commerciales de Fès.

## Stack

- **React Native** via Expo SDK 51
- **Expo Router** (file-based routing, similar to Next.js)
- **TypeScript**
- **Axios** (API calls)
- **expo-secure-store** (JWT token storage)
- Backend: `https://etec-fez.up.railway.app/api`

## Prérequis

- Node.js 18+
- npm or yarn
- [Expo Go](https://expo.dev/client) app on your phone (iOS or Android)

## Setup rapide

### 1. Installer les dépendances

```bash
cd mobile
npm install
```

### 2. Ajouter les assets (OBLIGATOIRE)

Avant de démarrer, placez ces images dans le dossier `assets/` :

| Fichier | Dimensions | Description |
|---|---|---|
| `icon.png` | 1024×1024 px | Icône de l'application |
| `adaptive-icon.png` | 1024×1024 px | Icône adaptative Android |
| `splash.png` | 1284×2778 px | Écran de démarrage |
| `favicon.png` | 48×48 px | Favicon web |

> **Astuce :** Utilisez un fond couleur `#06D6A0` (teal ETEC) avec le logo ETEC centré.

### 3. Démarrer le serveur de développement

```bash
npx expo start
```

Scannez le QR code avec l'application **Expo Go** sur votre téléphone.

- iOS: ouvrez l'app Appareil photo puis scannez
- Android: ouvrez Expo Go puis scannez

## Build pour les stores

### Setup EAS (une seule fois)

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build Android (APK pour test interne)

```bash
npm run build:android
# ou
eas build --platform android --profile preview
```

### Build iOS

```bash
npm run build:ios
# ou
eas build --platform ios --profile preview
```

### Production

```bash
eas build --platform all --profile production
```

## Structure du projet

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout (AuthProvider + SafeAreaProvider)
│   ├── index.tsx            # Redirect selon auth state
│   ├── login.tsx            # Écran de connexion
│   └── (app)/
│       ├── _layout.tsx      # Tab navigator (role-aware)
│       ├── index.tsx        # Dashboard
│       ├── notes.tsx        # Notes / Bulletin
│       ├── absences.tsx     # Absences
│       ├── planning.tsx     # Planning hebdomadaire
│       ├── profile.tsx      # Profil & déconnexion
│       └── users.tsx        # Gestion utilisateurs (admin/dev)
├── components/
│   ├── StatCard.tsx         # Carte statistique animée
│   ├── LoadingScreen.tsx    # Écran de chargement
│   └── EmptyState.tsx       # État vide (no data)
├── context/
│   └── AuthContext.tsx      # Auth state + login/logout
├── utils/
│   └── api.ts               # Instance Axios + intercepteurs
├── assets/                  # Images (à ajouter manuellement)
├── app.json                 # Config Expo
├── eas.json                 # Config EAS Build
├── babel.config.js
├── tsconfig.json
└── package.json
```

## Comptes de test

| Rôle | Description |
|---|---|
| `developpeur` | Accès total, toutes les fonctionnalités |
| `admin` | Dashboard stats, utilisateurs, absences, planning |
| `professeur` | Séances du jour, notes, absences par groupe |
| `etudiant` | Bulletin, absences, planning, évaluation des séances |

## Couleurs de la charte ETEC

| Nom | Valeur |
|---|---|
| Accent (teal) | `#06D6A0` |
| Secondary (purple) | `#7C3AED` |
| Blue | `#0EA5E9` |
| Background | `#0A0F1E` |
| Surface | `#111827` |
| Surface2 | `#1F2937` |
| Border | `#374151` |
| Text | `#F9FAFB` |
| TextMuted | `#9CA3AF` |

## Dépannage

**"Cannot find module 'expo-router/entry'"**
→ `npm install` puis `npx expo start --clear`

**QR code ne fonctionne pas**
→ Assurez-vous que votre téléphone et votre PC sont sur le même réseau Wi-Fi

**Erreur 401 après login**
→ Le token a expiré, reconnectez-vous

**Images manquantes (splash/icon)**
→ Ajoutez les fichiers PNG dans `assets/` avant de builder
