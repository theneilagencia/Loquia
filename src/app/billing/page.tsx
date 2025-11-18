'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';

export default function BillingPage() {
  const router = useRouter();
  const { subscription, hasActiveSubscription, loading } = useSubscription();
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  }

  async function openCustomerPortal() {
    if (!subscription?.stripe_customer_id) {
      alert('Erro: Customer ID não encontrado');
      return;
    }

    setLoadingPortal(true);

    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: subscription.stripe_customer_id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      // Redirecionar para Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      alert('Erro ao abrir portal. Tente novamente.');
    } finally {
      setLoadingPortal(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Minha Assinatura
          </h1>
          <p className="text-gray-600">
            Gerencie sua assinatura e informações de pagamento
          </p>
        </div>

        {/* Status da Assinatura */}
        {hasActiveSubscription && subscription ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Plano {subscription.plan_name.charAt(0).toUpperCase() + subscription.plan_name.slice(1)}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ● Ativa
                  </span>
                  <span className="text-sm text-gray-600">
                    {subscription.billing_interval === 'month' ? 'Mensal' : 'Anual'}
                  </span>
                </div>
              </div>
              <button
                onClick={openCustomerPortal}
                disabled={loadingPortal}
                className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50"
              >
                {loadingPortal ? 'Carregando...' : 'Gerenciar Assinatura'}
              </button>
            </div>

            {/* Informações */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-gray-900">
                  {subscription.status === 'active' ? 'Ativa' : subscription.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Próxima renovação:</span>
                <span className="font-medium text-gray-900">
                  {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma Assinatura Ativa
              </h2>
              <p className="text-gray-600 mb-6">
                Você não possui uma assinatura ativa no momento.
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600"
              >
                Ver Planos
              </button>
            </div>
          </div>
        )}

        {/* Informações sobre Customer Portal */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            O que você pode fazer no Portal de Gerenciamento:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Atualizar método de pagamento
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Fazer upgrade ou downgrade de plano
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Visualizar histórico de pagamentos
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Baixar faturas
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Cancelar assinatura
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
