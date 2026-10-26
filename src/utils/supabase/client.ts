import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta.env as any).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const createClient = () => {
  return createSupabaseClient(
    supabaseUrl || 'https://wqefjfbkpehdxyzvjpte.supabase.co',
    supabaseKey || 'sb_publishable_j93AIw_MvXh0RqzF5IlBPQ_fG7GR_av'
  );
};

export default createClient;
