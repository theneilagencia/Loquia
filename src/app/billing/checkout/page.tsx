'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { STRIPE_PRODUCTS } from '@/lib/stripe-client';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const plan = searchParams.get('plan') as 'basic' | 'pro' | 'enterprise' | null;
  const billing = searchParams.get('billing') as 'monthly' | 'yearly' | null;

  useEffect(() => {
    async function createCheckoutSession() {
      if (!plan || !billing) {
        setError('Plano ou período de cobrança não especificado');
        setLoading(false);
        return;
      }

      try {
        // Obter usuário autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('Usuário não autenticado:', userError);
          router.push(`/login?redirect=/billing/checkout&plan=${plan}&billing=${billing}`);
          return;
        }

        // Obter priceId do plano selecionado
        const priceId = STRIPE_PRODUCTS[plan]?.[billing]?.priceId;

        if (!priceId) {
          setError(`Plano ${plan} (${billing}) não configurado`);
          setLoading(false);
          return;
        }

        console.log('🛒 Creating checkout session...', {
          plan,
          billing,
          priceId,
          userId: user.id,
          email: user.email,
        });

        // Chamar API para criar sessão de checkout
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
            customerEmail: user.email,
            userId: user.id,
            planName: plan,
            billingInterval: billing,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar checkout');
        }

        if (!data.checkoutUrl) {
          throw new Error('URL de checkout não retornada');
        }

        console.log('✅ Checkout session created, redirecting to Stripe...');
        
        // Redirecionar para o Stripe Checkout
        window.location.href = data.checkoutUrl;
      } catch (err: any) {
        console.error('❌ Erro ao criar checkout:', err);
        setError(err.message || 'Erro ao processar checkout');
        setLoading(false);
      }
    }

    createCheckoutSession();
  }, [plan, billing, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro no Checkout</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-yellow-400 text-black py-2 px-4 rounded-lg font-semibold hover:bg-yellow-500 transition"
            >
              Voltar para Planos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="animate-spin h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Preparando Checkout...</h2>
          <p className="text-gray-600 mb-4">
            Você está sendo redirecionado para o Stripe para completar sua assinatura.
          </p>
          {plan && billing && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-600">
                Plano: <span className="font-semibold text-gray-900">{plan.toUpperCase()}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Cobrança: <span className="font-semibold text-gray-900">{billing === 'monthly' ? 'Mensal' : 'Anual'}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
