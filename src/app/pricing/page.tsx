'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { STRIPE_PRODUCTS, PLAN_FEATURES } from '@/lib/stripe-client';
import Image from 'next/image';

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [showMessage, setShowMessage] = useState(false);

  // Verificar se há mensagem de subscription necessária
  useEffect(() => {
    if (searchParams.get('message') === 'subscription_required') {
      setShowMessage(true);
    }
  }, [searchParams]);

  async function handleSelectPlan(planName: 'basic' | 'pro' | 'enterprise') {
    setLoading(planName);

    try {
      // Obter priceId correto
      const priceId = STRIPE_PRODUCTS[planName][billingInterval].priceId;

      if (!priceId) {
        alert('Plano não configurado. Entre em contato com o suporte.');
        setLoading(null);
        return;
      }

      // Redirecionar para login com o plano selecionado
      router.push(`/login?redirect=/pricing&plan=${planName}&billing=${billingInterval}`);
    } catch (error: any) {
      console.error('Erro ao selecionar plano:', error);
      alert('Erro ao processar. Tente novamente.');
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Mensagem de subscription necessária */}
        {showMessage && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Plano necessário:</strong> Para acessar a plataforma, você precisa assinar um de nossos planos.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowMessage(false)}
                  className="inline-flex text-yellow-400 hover:text-yellow-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Intent Proof Dashboard Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-block bg-gray-100 px-4 py-2 rounded-full mb-6">
              <span className="text-sm font-semibold text-gray-700">● INTENT PROOF DASHBOARD™</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Não adianta prometer,<br />é preciso mostrar
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto mb-4 font-medium">
              O Intent Proof Dashboard™ entrega transparência total e<br />prova real de que sua empresa está sendo usada pelas IAs
            </p>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-12">
              Acompanhe em tempo real como as IAs veem, consultam e recomendam sua empresa com métricas detalhadas, logs de intenção, provas técnicas, visualização do feed e analytics completos de consultas, ativações e leads
            </p>
            
            {/* AI Logos */}
            <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
              <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
                <Image src="/images/ai-logos/chatgpt.png" alt="ChatGPT" width={120} height={32} className="h-8 w-auto" />
              </div>
              <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
                <Image src="/images/ai-logos/gemini.png" alt="Gemini" width={120} height={32} className="h-8 w-auto" />
              </div>
              <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
                <Image src="/images/ai-logos/claude.png" alt="Claude" width={120} height={32} className="h-8 w-auto" />
              </div>
              <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
                <Image src="/images/ai-logos/perplexity.png" alt="Perplexity" width={120} height={32} className="h-8 w-auto" />
              </div>
            </div>
          </div>
        </div>

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
