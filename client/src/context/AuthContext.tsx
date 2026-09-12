import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateUserProfile: (name: string, avatar?: string, color?: string) => void;
  updateUser: (data: Partial<User>) => void;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('syncscribe_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const randomName = getRandomItem(PRESET_NAMES);
    const randomColor = getRandomItem(PRESET_COLORS);
    const newUser: User = {
      id: `user-${Math.random().toString(36).substring(2, 9)}`,
      name: randomName,
      color: randomColor,
    };
    localStorage.setItem('syncscribe_user', JSON.stringify(newUser));
    return newUser;
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
    localStorage.setItem('syncscribe_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

  return (
    <AuthContext.Provider value={{ user, theme, toggleTheme, updateUserProfile, updateUser }}>
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
