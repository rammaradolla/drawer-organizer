import { SupabaseUser } from '../utils/supabaseClient';

export interface UserContextType {
  user: SupabaseUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
} 