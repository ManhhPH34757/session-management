import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Users from './components/User';
import MyProfile from './components/MyProfile';
import Navbar from './components/Navbar';
import { setAuthDetails, checkRefreshTokenStatus, handleLogout } from './api';
import { jwtDecode } from 'jwt-decode';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <AppWrapper isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
    </Router>
  );
};

const AppWrapper: React.FC<{ isAuthenticated: boolean; setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>> }> = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  let userId: string | null = null;
  let isAdmin: boolean = false;

  useEffect(() => {
    setAuthDetails(navigate, setIsAuthenticated);
  }, [navigate, setIsAuthenticated]);

  useEffect(() => {
    if (token) {
      const decoded: any = jwtDecode(token);
      userId = decoded.userId;
      isAdmin = decoded.role === 'admin'; 

      const interval = setInterval(async () => {
        if (userId) {
          const refreshToken = await checkRefreshTokenStatus(userId);
          if (!refreshToken) {
            await handleLogout(navigate, setIsAuthenticated);
            window.location.reload();
          }
        }
      }, 1000); 

      return () => clearInterval(interval);
    }
  }, [navigate, setIsAuthenticated, token]);

  return (
    <>
      {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/my-profile" /> : <Navigate to="/login" />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/my-profile" /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/users" element={isAuthenticated ? <Users/> : <Navigate to="/login" />} />
        <Route path="/my-profile" element={isAuthenticated ? <MyProfile /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
};

export default App;
