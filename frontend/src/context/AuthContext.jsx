import { createContext, useContext, useReducer, useEffect } from 'react';
import * as authApi from '../api/auth.api';

// ── State ────────────────────────────────────────────────────
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until we know auth status
};

// ── Reducer ──────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'CLEAR_USER':
      return { ...state, user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: check if a JWT cookie session exists by calling login with stored user info
  // We persist user info in sessionStorage as a lightweight session hint
  useEffect(() => {
    const stored = sessionStorage.getItem('auth_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        dispatch({ type: 'SET_USER', payload: user });
      } catch {
        dispatch({ type: 'CLEAR_USER' });
      }
    } else {
      dispatch({ type: 'CLEAR_USER' });
    }
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const user = res.data.data.user;
    sessionStorage.setItem('auth_user', JSON.stringify(user));
    dispatch({ type: 'SET_USER', payload: user });
    return user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      sessionStorage.removeItem('auth_user');
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  const register = async (data) => {
    await authApi.register(data);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
