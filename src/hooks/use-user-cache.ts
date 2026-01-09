"use client";

import { useState, useEffect, useCallback } from 'react';

interface CachedUser {
  id: number;
  email: string;
  userType: string | null;
  idCustomer: number | null;
  idProfile: number | null;
  fullAccess: boolean | null;
}

export function useUserCache() {
  const [user, setUser] = useState<CachedUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsSignedIn(true);
        } else {
          setUser(null);
          setIsSignedIn(false);
        }
      } catch {
        setUser(null);
        setIsSignedIn(false);
      } finally {
        setIsLoaded(true);
      }
    }

    checkAuth();
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      setIsSignedIn(false);
      window.location.href = '/auth/sign-in';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/auth/sign-in';
    }
  }, []);

  return { user, isLoaded, isSignedIn, logout };
}
