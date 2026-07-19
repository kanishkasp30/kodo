import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimer = useRef(null);

  const scheduleAutoLogout = (jwtToken) => {
    const decoded = decodeToken(jwtToken);
    if (!decoded || !decoded.exp) return;

    const expiryTime = decoded.exp * 1000;
    const now = Date.now();
    const msUntilExpiry = expiryTime - now;

    if (msUntilExpiry <= 0) {
      logoutUser();
      return;
    }

    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      logoutUser();
    }, msUntilExpiry);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (savedToken && savedUser) {
      const decoded = decodeToken(savedToken);
      const isExpired = decoded && decoded.exp * 1000 < Date.now();

      if (isExpired) {
        logoutUser();
      } else {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        scheduleAutoLogout(savedToken);
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (userData, userToken, keepSignedIn = true) => {
    setUser(userData);
    setToken(userToken);

    const storage = keepSignedIn ? localStorage : sessionStorage;
    storage.setItem('token', userToken);
    storage.setItem('user', JSON.stringify(userData));

    scheduleAutoLogout(userToken);
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentWorkspace');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);



