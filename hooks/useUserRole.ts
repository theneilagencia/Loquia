import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export type UserRole = 'admin' | 'agency' | 'client' | null;

interface UserRoleData {
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isAgency: boolean;
  isClient: boolean;
  isReadOnly: boolean;
}

/**
 * Hook para obter o role do usuário atual
 * Busca o profile do usuário no Supabase
 */
export function useUserRole(): UserRoleData {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else {
          setRole(profile?.role || null);
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isAgency: role === 'agency',
    isClient: role === 'client',
    isReadOnly: role === 'client', // Clientes são read-only
  };
}
