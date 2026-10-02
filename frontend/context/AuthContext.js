"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { apiFetch } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3-4 Second Logout Transition State
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutProgress, setLogoutProgress] = useState(20);
  const [logoutMessage, setLogoutMessage] = useState("Securing session & credentials...");

  const fetchCurrentUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await apiFetch("http://localhost:8000/auth/me");

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();
      setUser(data);
      return data;
    } catch (error) {
      console.error("Authentication error:", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await apiFetch("http://localhost:8000/auth/me");

        if (!response.ok) {
          if (isMounted) setUser(null);
          return;
        }

        const data = await response.json();
        if (isMounted) setUser(data);
      } catch (err) {
        console.error("Auth error:", err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (token) => {
    localStorage.setItem("access_token", token);
    setLoading(true);
    return await fetchCurrentUser();
  };

  // 3.5 Second Smooth Logout Experience
  const logout = () => {
    setIsLoggingOut(true);
    setLogoutProgress(35);
    setLogoutMessage("Securing account session & credentials...");

    setTimeout(() => {
      setLogoutProgress(70);
      setLogoutMessage("Clearing local cache & authentication tokens...");
    }, 1200);

    setTimeout(() => {
      setLogoutProgress(100);
      setLogoutMessage("Logged out successfully. Returning to storefront...");
    }, 2400);

    setTimeout(() => {
      localStorage.removeItem("access_token");
      setUser(null);
      setIsLoggingOut(false);
      window.location.href = "/";
    }, 3500);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isLoggingOut,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}

      {/* 3-4 SECOND LOGOUT PROGRESS OVERLAY */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/40 bg-gray-900 p-8 text-center shadow-2xl space-y-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-red-600/20 border border-red-500 flex items-center justify-center text-3xl animate-pulse">
              🚪
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Signing Out</h3>
              <p className="mt-2 text-xs text-red-400 font-semibold h-5 transition-all">
                {logoutMessage}
              </p>
            </div>

            {/* Progress Bar (3.5s transition) */}
            <div className="w-full bg-gray-950 rounded-full h-2.5 p-0.5 border border-gray-800 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${logoutProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-gray-500">
              Thank you for shopping with ShopSphere. See you soon!
            </p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}