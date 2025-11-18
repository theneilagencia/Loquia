'use client';

import Link from 'next/link';

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de cancelamento */}
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Pagamento Cancelado
        </h1>

        {/* Mensagem */}
        <p className="text-gray-600 mb-8">
          Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
        </p>

        {/* Informações */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-600 mb-2">
            Se você encontrou algum problema ou tem dúvidas, entre em contato conosco.
          </p>
          <p className="text-sm text-gray-600">
            Email: <a href="mailto:contato@loquia.com.br" className="text-yellow-500 hover:underline">contato@loquia.com.br</a>
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pricing"
            className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600"
          >
            Ver Planos Novamente
          </Link>
          <Link
            href="/"
            className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
