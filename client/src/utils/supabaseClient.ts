import { createClient, User, Session, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseUser = Pick<User, 'id' | 'email' | 'user_metadata'> & {
  name?: string;
  role?: string;
  access_token?: string;
  isImpersonating?: boolean;
  impersonator?: {
    id: string;
    role: string;
    email?: string;
  };
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

export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage.from('designs').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getSignedUrl(filePath: string) {
  const { data, error } = await supabase
    .storage
    .from('designs')
    .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 1 week
  if (error) throw error;
  return data.signedUrl;
}

// Use publicUrl as the src for your <img> 

// Remove these lines:
// const publicUrl = getPublicUrl('drawer-photos/<userId>/<filename>.jpeg');
// const imageUrl = `https://<project-ref>.supabase.co/storage/v1/object/public/designs/${filePath}`; 

async function handleLogout() {
  const user = supabase.auth.getUser();
  if (!user) {
    // Already logged out, just redirect or update UI
    return;
  }
  await supabase.auth.signOut();
} 