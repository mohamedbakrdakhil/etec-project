import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AIAssistant from './components/AIAssistant';

// Lazy-load all pages for fastest initial load + instant navigation
const Login            = lazy(() => import('./pages/Login'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const Users            = lazy(() => import('./pages/Users'));
const Filieres         = lazy(() => import('./pages/Filieres'));
const Groupes          = lazy(() => import('./pages/Groupes'));
const Notes            = lazy(() => import('./pages/Notes'));
const Absences         = lazy(() => import('./pages/Absences'));
const Planning         = lazy(() => import('./pages/Planning'));
const Enseignements    = lazy(() => import('./pages/Enseignements'));
const Annonces         = lazy(() => import('./pages/Annonces'));
const Logs             = lazy(() => import('./pages/Logs'));
const Paiements        = lazy(() => import('./pages/Paiements'));
const ProfDashboard    = lazy(() => import('./pages/ProfDashboard'));
const EtudiantDashboard= lazy(() => import('./pages/EtudiantDashboard'));
const EtudiantNotes    = lazy(() => import('./pages/EtudiantNotes'));
const EtudiantAbsences = lazy(() => import('./pages/EtudiantAbsences'));

const PageLoader = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:14}}>
    <div style={{width:38,height:38,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>
    <span style={{color:'var(--text-muted)',fontSize:13}}>Chargement...</span>
  </div>
);

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

// Show AI only when logged in
const AIAssistantWrapper = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <AIAssistant />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
        <AIAssistantWrapper />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
