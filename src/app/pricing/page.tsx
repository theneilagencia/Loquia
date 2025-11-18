'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { STRIPE_PRODUCTS, PLAN_FEATURES } from '@/lib/stripe';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  async function handleSelectPlan(planName: 'basic' | 'pro' | 'enterprise') {
    setLoading(planName);

    try {
      // Verificar se usuário está logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirecionar para login
        router.push(`/login?redirect=/pricing&plan=${planName}`);
        return;
      }

      // Obter priceId correto
      const priceId = STRIPE_PRODUCTS[planName][billingInterval].priceId;

      if (!priceId) {
        alert('Plano não configurado. Entre em contato com o suporte.');
        setLoading(null);
        return;
      }

      // Criar checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerEmail: user.email,
          userId: user.id,
          planName,
          billingInterval,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setLoading(null);
        return;
      }

      // Redirecionar para checkout
      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A voz da sua marca na era da IA
          </p>

          {/* Toggle Mensal/Anual */}
          <div className="flex items-center justify-center gap-4">
            <span className={billingInterval === 'monthly' ? 'font-semibold' : 'text-gray-500'}>
              Mensal
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-yellow-500 transition ${
                  billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={billingInterval === 'yearly' ? 'font-semibold' : 'text-gray-500'}>
              Anual
              <span className="ml-2 text-sm text-green-600">(30% OFF)</span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-yellow-500 transition">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${billingInterval === 'monthly' ? '59' : '41.30'}
              </span>
              <span className="text-gray-600">/{billingInterval === 'monthly' ? 'mês' : 'mês'}</span>
              {billingInterval === 'yearly' && (
                <p className="text-sm text-gray-500 mt-1">$495.60 cobrado anualmente</p>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              {PLAN_FEATURES.basic.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPlan('basic')}
              disabled={loading === 'basic'}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {loading === 'basic' ? 'Processando...' : 'Escolher Basic'}
            </button>
          </div>

          {/* Pro Plan (Destaque) */}
          <div className="border-2 border-yellow-500 rounded-lg p-8 relative shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
              MAIS POPULAR
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${billingInterval === 'monthly' ? '79' : '55.30'}
              </span>
              <span className="text-gray-600">/{billingInterval === 'monthly' ? 'mês' : 'mês'}</span>
              {billingInterval === 'yearly' && (
                <p className="text-sm text-gray-500 mt-1">$663.60 cobrado anualmente</p>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              {PLAN_FEATURES.pro.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={loading === 'pro'}
              className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50"
            >
              {loading === 'pro' ? 'Processando...' : 'Escolher Pro'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-yellow-500 transition">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${billingInterval === 'monthly' ? '280' : '196'}
              </span>
              <span className="text-gray-600">/{billingInterval === 'monthly' ? 'mês' : 'mês'}</span>
              {billingInterval === 'yearly' && (
                <p className="text-sm text-gray-500 mt-1">$2,352 cobrado anualmente</p>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              {PLAN_FEATURES.enterprise.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPlan('enterprise')}
              disabled={loading === 'enterprise'}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {loading === 'enterprise' ? 'Processando...' : 'Escolher Enterprise'}
            </button>
          </div>
        </div>

        {/* FAQ ou Garantia */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Todas as assinaturas incluem cancelamento a qualquer momento
          </p>
          <p className="text-gray-600 mt-2">
            Dúvidas? Entre em contato: <a href="mailto:contato@loquia.com.br" className="text-yellow-500 hover:underline">contato@loquia.com.br</a>
          </p>
        </div>
      </div>
    </div>
  );
}
