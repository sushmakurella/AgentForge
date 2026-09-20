import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicAuthRoute from './components/PublicAuthRoute';
import DashboardLayout from './components/DashboardLayout';
import AuthPage from './components/AuthPage';
import MarketplacePage from './pages/MarketplacePage';
import ChatPage from './pages/ChatPage';
import ToolsPage from './pages/ToolsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamPage from './pages/TeamPage';

function AppRoutes() {
  const { theme, setTheme } = useApp();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicAuthRoute>
            <AuthPage theme={theme} setTheme={setTheme} initialMode="signin" />
          </PublicAuthRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicAuthRoute>
            <AuthPage theme={theme} setTheme={setTheme} initialMode="signup" />
          </PublicAuthRoute>
        }
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MarketplacePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:agentId" element={<ChatPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="team" element={<TeamPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
