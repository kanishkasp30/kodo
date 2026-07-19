import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  parchment: {
    name: 'Warm Parchment',
    bg: '#F5F0E8',
    sidebar: '#EDE6D6',
    card: '#FFFFFF',
    cardBorder: 'rgba(28,25,23,0.1)',
    text: '#1C1917',
    textSecondary: '#5A7A5E',
    textMuted: '#9B9890',
    accent: '#E8572A',
    navActive: 'rgba(232,87,42,0.1)',
    navActiveBorder: '#E8572A',
    input: '#FFFFFF',
    inputBorder: 'rgba(28,25,23,0.15)',
    topbar: '#EDE6D6',
    dot: '#E8572A',
  },
  navy: {
    name: 'Midnight Navy',
    bg: '#1B2A4A',
    sidebar: '#162039',
    card: 'rgba(255,255,255,0.07)',
    cardBorder: 'rgba(245,240,232,0.1)',
    text: '#F5F0E8',
    textSecondary: 'rgba(245,240,232,0.6)',
    textMuted: 'rgba(245,240,232,0.35)',
    accent: '#E8572A',
    navActive: 'rgba(232,87,42,0.15)',
    navActiveBorder: '#E8572A',
    input: 'rgba(255,255,255,0.08)',
    inputBorder: 'rgba(245,240,232,0.15)',
    topbar: '#162039',
    dot: '#E8572A',
  },
  carbon: {
    name: 'Carbon Ink',
    bg: '#1C1917',
    sidebar: '#141210',
    card: 'rgba(245,240,232,0.05)',
    cardBorder: 'rgba(245,240,232,0.08)',
    text: '#F5F0E8',
    textSecondary: 'rgba(245,240,232,0.55)',
    textMuted: 'rgba(245,240,232,0.3)',
    accent: '#E8572A',
    navActive: 'rgba(108,92,231,0.2)',
    navActiveBorder: '#6C5CE7',
    input: 'rgba(245,240,232,0.05)',
    inputBorder: 'rgba(245,240,232,0.1)',
    topbar: '#141210',
    dot: '#6C5CE7',
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('carbon');
  const theme = themes[themeName];

  useEffect(() => {
    const saved = localStorage.getItem('kodo-theme');
    if (saved && themes[saved]) setThemeName(saved);
  }, []);

  const switchTheme = (name) => {
    setThemeName(name);
    localStorage.setItem('kodo-theme', name);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, switchTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);



