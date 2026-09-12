import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthUser extends User {
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser;
  isAuthenticated: boolean;
  token: string | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateUserProfile: (name: string, avatar?: string, color?: string) => void;
  updateUser: (data: Partial<User>) => void;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#14b8a6', // teal
];

const PRESET_NAMES = [
  'Alex Rivera',
  'Maya Chen',
  'Dhruv Sharma',
  'Elena Rostova',
  'Jordan Lee',
  'Sam Taylor',
  'Sophia Patel',
  'Liam Vance',
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const createGuestUser = (): AuthUser => ({
  id: `guest-${Math.random().toString(36).substring(2, 9)}`,
  name: getRandomItem(PRESET_NAMES),
  color: getRandomItem(PRESET_COLORS),
  role: 'guest',
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem('syncscribe_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed as AuthUser;
      } catch (e) {
        console.error(e);
      }
    }
    return createGuestUser();
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('syncscribe_token');
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('syncscribe_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('syncscribe_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('syncscribe_token', token);
    } else {
      localStorage.removeItem('syncscribe_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('syncscribe_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const login = (newUser: AuthUser, newToken: string) => {
    // If auth response has no name but email exists, derive a display name
    const normalized: AuthUser = {
      ...newUser,
      name: newUser.name || newUser.email?.split('@')[0] || 'User',
      color: newUser.color || getRandomItem(PRESET_COLORS),
      role: newUser.role || 'user',
    };
    setUser(normalized);
    setToken(newToken);
  };

  const logout = () => {
    setUser(createGuestUser());
    setToken(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const updateUserProfile = (name: string, avatar?: string, color?: string) => {
    setUser((prev) => ({
      ...prev,
      name: name || prev.name,
      avatar: avatar !== undefined ? avatar : prev.avatar,
      color: color || prev.color,
    }));
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => ({
      ...prev,
      ...data,
    }));
  };

  // Authenticated = has a server-issued token and a real (non-guest) user
  const isAuthenticated = !!token && !!user && user.role !== 'guest';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, token, theme, toggleTheme, updateUserProfile, updateUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
