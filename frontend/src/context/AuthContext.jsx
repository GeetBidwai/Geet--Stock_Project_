import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login, signup } from "../services/authService";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "stock_access_token";
const REFRESH_TOKEN_KEY = "stock_refresh_token";
const USER_KEY = "stock_user";

function setSessionTokens(access, refresh) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getInitialUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hasToken() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken);

  const hydrateUser = async () => {
    const profile = await getCurrentUser();
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
    setIsAuthenticated(true);
    return profile;
  };

  const signupUser = async (payload) => {
    const data = await signup(payload);
    setSessionTokens(data.access, data.refresh);
    await hydrateUser();
  };

  const loginUser = async (payload) => {
    const data = await login(payload);
    setSessionTokens(data.access, data.refresh);
    await hydrateUser();
  };

  const logoutUser = () => {
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!hasToken() || user) {
        return;
      }
      try {
        await hydrateUser();
      } catch {
        logoutUser();
      }
    };
    bootstrap();
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      signupUser,
      loginUser,
      logoutUser,
      hydrateUser,
    }),
    [user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
