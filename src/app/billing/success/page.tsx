'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de sucesso */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Pagamento Confirmado!
        </h1>

        {/* Mensagem */}
        <p className="text-gray-600 mb-8">
          Sua assinatura foi ativada com sucesso. Bem-vindo à Loquia!
        </p>

        {/* Informações */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-600 mb-2">
            Você receberá um email de confirmação em breve.
          </p>
          <p className="text-sm text-gray-600">
            Sua assinatura já está ativa e você pode começar a usar todos os recursos da plataforma.
          </p>
        </div>

        {/* Countdown */}
        <p className="text-sm text-gray-500 mb-6">
          Redirecionando para o dashboard em {countdown} segundos...
        </p>

        {/* Botão */}
        <Link
          href="/dashboard"
          className="inline-block bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600"
        >
          Ir para o Dashboard
        </Link>

        {/* Session ID (para debug) */}
        {sessionId && (
          <p className="text-xs text-gray-400 mt-8">
            Session ID: {sessionId}
          </p>
        )}
      </div>
    </div>
  );
}
