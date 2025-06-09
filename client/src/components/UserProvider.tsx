import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserContextType } from '../types/supabase';
import { getSupabaseUser, onAuthStateChange } from '../utils/auth';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setLoading(true);
    setUser(await getSupabaseUser());
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
    const { data: listener } = onAuthStateChange(() => {
      refreshUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
} 