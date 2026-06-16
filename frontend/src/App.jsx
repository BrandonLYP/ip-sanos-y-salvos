import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MapaPage } from './pages/MapaPage';
import { MascotasPage } from './pages/MascotasPage';
import { MascotaDetallePage } from './pages/MascotaDetallePage';
import { ReportarPage } from './pages/ReportarPage';
import { AlertasPage } from './pages/AlertasPage';
import { IaPage } from './pages/IaPage';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mapa"
        element={
          <PrivateRoute>
            <Layout>
              <MapaPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mascotas"
        element={
          <PrivateRoute>
            <Layout>
              <MascotasPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mascotas/:id"
        element={
          <PrivateRoute>
            <Layout>
              <MascotaDetallePage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reportar/:tipo"
        element={
          <PrivateRoute>
            <Layout>
              <ReportarPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/alertas"
        element={
          <PrivateRoute>
            <Layout>
              <AlertasPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/ia"
        element={
          <PrivateRoute>
            <Layout>
              <IaPage />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
