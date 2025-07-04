import { supabase, SupabaseUser, getCurrentUser } from './supabaseClient';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getSupabaseUser(): Promise<SupabaseUser | null> {
  const session = await getSession();
  const baseUser = getCurrentUser(session);
  if (!baseUser) return null;

  // Fetch user row from users table to get role and name
  const { data: dbUser, error } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('email', baseUser.email)
    .single();

  if (error || !dbUser) {
    return { ...baseUser, access_token: session?.access_token || null };
  }

  return {
    ...baseUser,
    name: dbUser.name || baseUser.name,
    role: dbUser.role || null,
    access_token: session?.access_token || null,
    dbUser
  };
}
