import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => { setUser(data.user); setOrg(data.org); })
        .catch(() => { localStorage.clear(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
    setOrg(data.org);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.clear();
    setUser(null);
    setOrg(null);
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  };

  const isTrialExpired = () => {
    if (!org) return false;
    if (org.subscription_status === 'active') return false;
    if (org.subscription_status === 'trial') {
      return new Date(org.trial_ends_at) < new Date();
    }
    return true;
  };

  const trialDaysLeft = () => {
    if (!org || org.subscription_status !== 'trial') return 0;
    const diff = new Date(org.trial_ends_at) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <AuthContext.Provider value={{ user, org, loading, login, register, logout, forgotPassword, isTrialExpired, trialDaysLeft, setOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
