import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import ListView from './pages/ListView';
import Snippets from './pages/Snippets';
import Wiki from './pages/Wiki';
import AIAssistant from './pages/AIAssistant';
import Activity from './pages/Activity';
import Members from './pages/Members';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1C1917', color: '#E8572A', fontSize: '18px', fontFamily: 'JetBrains Mono, monospace' }}>
        Loading Kōdo...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { theme } = useTheme();
  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme.card,
            color: theme.text,
            border: `0.5px solid ${theme.cardBorder}`,
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={
            <PrivateRoute><Onboarding /></PrivateRoute>
          } />
          <Route path="/app" element={
            <PrivateRoute><Layout /></PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="board/:projectId" element={<Board />} />
            <Route path="list/:projectId" element={<ListView />} />
            <Route path="snippets/:projectId" element={<Snippets />} />
            <Route path="wiki/:projectId" element={<Wiki />} />
            <Route path="ai/:projectId" element={<AIAssistant />} />
            <Route path="activity" element={<Activity />} />
            <Route path="members" element={<Members />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;