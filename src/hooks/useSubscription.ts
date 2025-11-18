import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  plan_name: string;
  billing_interval: string;
  status: string;
  current_period_end: string;
  stripe_customer_id: string;
}

export function useSubscription() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  async function checkSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar subscription ativa
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar subscription:', error);
      }

      if (data) {
        setSubscription(data);
        setHasActiveSubscription(true);
      } else {
        setHasActiveSubscription(false);
      }
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  function requireActiveSubscription() {
    if (!loading && !hasActiveSubscription) {
      router.push('/pricing');
    }
  }

  return {
    subscription,
    hasActiveSubscription,
    loading,
    checkSubscription,
    requireActiveSubscription,
  };
}
