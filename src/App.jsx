import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UsersProvider } from './contexts/UsersContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner fullscreen />;
  return currentUser ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingSpinner fullscreen />;
  return currentUser ? <Navigate to="/" replace /> : children;
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
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UsersProvider>
          <AppRoutes />
        </UsersProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
