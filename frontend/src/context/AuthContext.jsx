import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, login, logout, signup } from "../services/authService";
import { AuthContext } from "./context";

const TOKEN_KEY = "stock_auth_token";
const USER_KEY = "stock_user";

function setSessionToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
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
  return Boolean(localStorage.getItem(TOKEN_KEY));
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
    setSessionToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
  };

  const loginUser = async (payload) => {
    const data = await login(payload);
    setSessionToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
  };

  const logoutUser = async () => {
    try {
      if (hasToken()) {
        await logout();
      }
    } catch {
      // Clear local session even if the API token is already invalid.
    }
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
