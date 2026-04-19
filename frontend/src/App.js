import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Filieres from './pages/Filieres';
import Groupes from './pages/Groupes';
import Modules from './pages/Modules';
import Notes from './pages/Notes';
import Absences from './pages/Absences';
import Planning from './pages/Planning';
import Enseignements from './pages/Enseignements';
import Annonces from './pages/Annonces';
import Logs from './pages/Logs';
import Paiements from './pages/Paiements';
import ProfDashboard from './pages/ProfDashboard';
import EtudiantDashboard from './pages/EtudiantDashboard';
import EtudiantNotes from './pages/EtudiantNotes';
import EtudiantAbsences from './pages/EtudiantAbsences';

// Protected Route
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#6B7280'}}>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

// Redirect based on role
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const routes = { developpeur: '/dev', admin: '/admin', professeur: '/prof', etudiant: '/etudiant' };
  return <Navigate to={routes[user.role] || '/login'} />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* ==================== DÉVELOPPEUR ==================== */}
          <Route path="/dev" element={
            <ProtectedRoute roles={['developpeur']}>
              <Layout pageTitle="Espace Développeur" />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="filieres" element={<Filieres />} />
            <Route path="groupes" element={<Groupes />} />
            <Route path="modules" element={<Modules />} />
            <Route path="notes" element={<Notes />} />
            <Route path="absences" element={<Absences />} />
            <Route path="planning" element={<Planning />} />
            <Route path="enseignements" element={<Enseignements />} />
            <Route path="paiements" element={<Paiements />} />
            <Route path="annonces" element={<Annonces />} />
            <Route path="logs" element={<Logs />} />
          </Route>

          {/* ==================== ADMIN ==================== */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <Layout pageTitle="Administration" />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="filieres" element={<Filieres />} />
            <Route path="groupes" element={<Groupes />} />
            <Route path="modules" element={<Modules />} />
            <Route path="notes" element={<Notes />} />
            <Route path="absences" element={<Absences />} />
            <Route path="planning" element={<Planning />} />
            <Route path="enseignements" element={<Enseignements />} />
            <Route path="paiements" element={<Paiements />} />
            <Route path="annonces" element={<Annonces />} />
          </Route>

          {/* ==================== PROFESSEUR ==================== */}
          <Route path="/prof" element={
            <ProtectedRoute roles={['professeur']}>
              <Layout pageTitle="Espace Professeur" />
            </ProtectedRoute>
          }>
            <Route index element={<ProfDashboard />} />
            <Route path="notes" element={<Notes />} />
            <Route path="absences" element={<Absences />} />
            <Route path="planning" element={<Planning readOnly />} />
          </Route>

          {/* ==================== ÉTUDIANT ==================== */}
          <Route path="/etudiant" element={
            <ProtectedRoute roles={['etudiant']}>
              <Layout pageTitle="Espace Étudiant" />
            </ProtectedRoute>
          }>
            <Route index element={<EtudiantDashboard />} />
            <Route path="notes" element={<EtudiantNotes />} />
            <Route path="absences" element={<EtudiantAbsences />} />
            <Route path="planning" element={<Planning readOnly />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
