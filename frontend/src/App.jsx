import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GoalSetting from './pages/GoalSetting';
import CheckIns from './pages/CheckIns';
import Sidebar from './components/Sidebar';
import axios from 'axios';

// Set base URL for API
axios.defaults.baseURL = 'http://localhost:5000';

const PrivateRoute = ({ children, user }) => {
  return user ? children : <Navigate to="/login" />;
};

const AppLayout = ({ children, user, onLogout }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        
        <Route path="/" element={
          <PrivateRoute user={user}>
            <AppLayout user={user} onLogout={handleLogout}>
              <Dashboard user={user} />
            </AppLayout>
          </PrivateRoute>
        } />
        
        <Route path="/goals" element={
          <PrivateRoute user={user}>
            <AppLayout user={user} onLogout={handleLogout}>
              <GoalSetting user={user} />
            </AppLayout>
          </PrivateRoute>
        } />

        <Route path="/check-ins" element={
          <PrivateRoute user={user}>
            <AppLayout user={user} onLogout={handleLogout}>
              <CheckIns user={user} />
            </AppLayout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
