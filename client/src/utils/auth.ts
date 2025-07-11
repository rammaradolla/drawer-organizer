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
  // Check for impersonation token first
  const impersonationToken = typeof window !== 'undefined' ? localStorage.getItem('impersonation_token') : null;
  if (impersonationToken) {
    try {
      const res = await fetch('/api/admin/users/me', {
        headers: { Authorization: `Bearer ${impersonationToken}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        return {
          ...data.user,
          access_token: impersonationToken || undefined,
          isImpersonating: true,
          impersonator: data.user.impersonator || null
        };
      }
    } catch (e) {
      // If error, fall back to normal session
    }
  }
  // Fallback: use Supabase session
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
    return { ...baseUser, access_token: session?.access_token || undefined };
  }

  return {
    ...baseUser,
    name: dbUser.name || baseUser.name,
    role: dbUser.role || null,
    access_token: session?.access_token || undefined
  };
}

// Store admin token before impersonating
export function startImpersonation(impersonationToken: string) {
  const currentToken = localStorage.getItem('impersonation_token') || localStorage.getItem('sb-access-token') || null;
  if (!localStorage.getItem('admin_token')) {
    // Save the current token as admin_token if not already saved
    localStorage.setItem('admin_token', currentToken || '');
  }
  localStorage.setItem('impersonation_token', impersonationToken);
}

// Restore admin token and remove impersonation token
export function stopImpersonation() {
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    localStorage.setItem('impersonation_token', '');
    localStorage.removeItem('impersonation_token');
    localStorage.setItem('sb-access-token', adminToken);
    localStorage.removeItem('admin_token');
  } else {
    // Just remove impersonation token if no admin_token
    localStorage.removeItem('impersonation_token');
  }
}
