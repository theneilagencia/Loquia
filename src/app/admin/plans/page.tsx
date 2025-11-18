'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireRole from '@/components/auth/RequireRole';
import { listPlans, togglePlanStatus, Plan } from '@/lib/admin/plans';
import { useToast } from '@/app/contexts/ToastContext';

export default function PlansPage() {
  return (
    <RequireRole role="superadmin">
      <PlansManagement />
    </RequireRole>
  );
}

function PlansManagement() {
  const { showSuccess, showError } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await listPlans();
      setPlans(data);
    } catch (error) {
      showError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(planId: string, currentStatus: boolean) {
    try {
      await togglePlanStatus(planId, !currentStatus);
      showSuccess(`Plano ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      await loadPlans();
    } catch (error) {
      showError('Erro ao alterar status do plano');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Gerenciar Planos
            </h1>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ← Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="px-6 py-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      plan.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  {plan.description || 'Sem descrição'}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    R$ {plan.price.toFixed(2)}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{plan.billing_period === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-gray-900">Recursos:</h4>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6 text-sm text-gray-600">
                  <p>
                    <strong>Catálogo:</strong>{' '}
                    {plan.max_catalog_items || 'Ilimitado'}
                  </p>
                  <p>
                    <strong>Intenções:</strong>{' '}
                    {plan.max_intents || 'Ilimitado'}
                  </p>
                  <p>
                    <strong>Feeds:</strong> {plan.max_feeds || 'Ilimitado'}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                    plan.is_active
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {plan.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
