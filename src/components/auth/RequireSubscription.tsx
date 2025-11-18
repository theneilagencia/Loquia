'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';

interface RequireSubscriptionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RequireSubscription({ 
  children, 
  fallback 
}: RequireSubscriptionProps) {
  const router = useRouter();
  const { hasActiveSubscription, loading } = useSubscription();

  useEffect(() => {
    if (!loading && !hasActiveSubscription) {
      router.push('/pricing');
    }
  }, [loading, hasActiveSubscription, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Assinatura Necessária
          </h2>
          <p className="text-gray-600 mb-6">
            Você precisa de uma assinatura ativa para acessar esta área.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600"
          >
            Ver Planos
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
