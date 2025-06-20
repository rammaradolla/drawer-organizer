import { createClient, User, Session, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseUser = Pick<User, 'id' | 'email' | 'user_metadata'> & {
  name?: string;
  role?: string;
  access_token?: string;
};

export function getCurrentUser(session: Session | null): SupabaseUser | null {
  if (!session?.user) return null;
  const { id, email, user_metadata } = session.user;
  return {
    id,
    email,
    user_metadata,
    name: user_metadata?.full_name || user_metadata?.name || '',
  };
} 