'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireRole from '@/components/auth/RequireRole';
import { listUsers, toggleUserStatus, changeUserRole, deleteUser, assignPlanToUser } from '@/lib/admin/users';
import { listPlans } from '@/lib/admin/plans';
import { UserRole } from '@/hooks/useAuth';
import { useToast } from '@/app/contexts/ToastContext';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  plan_id?: string;
  is_active: boolean;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function UsersPage() {
  return (
    <RequireRole role="superadmin">
      <UsersManagement />
    </RequireRole>
  );
}

function UsersManagement() {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usersData, plansData] = await Promise.all([
        listUsers(),
        listPlans()
      ]);
      setUsers(usersData as User[]);
      setPlans(plansData as Plan[]);
    } catch (error) {
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: boolean) {
    try {
      await toggleUserStatus(userId, !currentStatus);
      showSuccess(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`);
      await loadData();
    } catch (error) {
      showError('Erro ao alterar status do usuário');
    }
  }

  async function handleChangeRole(userId: string, newRole: UserRole) {
    try {
      await changeUserRole(userId, newRole);
      showSuccess('Role alterado com sucesso');
      await loadData();
    } catch (error) {
      showError('Erro ao alterar role do usuário');
    }
  }

  async function handleChangePlan(userId: string, planId: string) {
    try {
      await assignPlanToUser(userId, planId);
      showSuccess('Plano atribuído com sucesso');
      await loadData();
    } catch (error) {
      showError('Erro ao atribuir plano');
    }
  }

  async function handleResetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      showSuccess(`Email de reset de senha enviado para ${email}`);
    } catch (error) {
      showError('Erro ao enviar email de reset');
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
      return;
    }

    try {
      await deleteUser(userId);
      showSuccess('Usuário excluído com sucesso');
      await loadData();
    } catch (error) {
      showError('Erro ao excluir usuário');
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'active') return user.is_active;
    if (filter === 'inactive') return !user.is_active;
    return true;
  });

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
              Gerenciar Usuários
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
        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'active'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            Ativos ({users.filter(u => u.is_active).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'inactive'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            Inativos ({users.filter(u => !u.is_active).length})
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.full_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.plan_id || ''}
                      onChange={(e) => handleChangePlan(user.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">Sem plano</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - R$ {plan.price}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      className="text-blue-600 hover:text-blue-900"
                      title={user.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {user.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.email)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Resetar senha"
                    >
                      Reset Senha
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir usuário"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
