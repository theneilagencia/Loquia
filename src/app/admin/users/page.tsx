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

// Interface para rastrear mudanças pendentes
interface PendingChanges {
  role?: UserRole;
  plan_id?: string;
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Rastrear mudanças pendentes por usuário
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChanges>>({});
  const [savingUsers, setSavingUsers] = useState<Set<string>>(new Set());
  
  // Form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as UserRole,
    plan_id: ''
  });

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

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      showError('Email e senha são obrigatórios');
      return;
    }

    setCreating(true);
    
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não foi criado');

      // Atualizar role no user_profiles
      if (newUser.role !== 'user') {
        await changeUserRole(authData.user.id, newUser.role);
      }

      // Atribuir plano se selecionado
      if (newUser.plan_id) {
        await assignPlanToUser(authData.user.id, newUser.plan_id);
      }

      showSuccess('Usuário criado com sucesso!');
      setShowCreateModal(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        plan_id: ''
      });
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      showError(error.message || 'Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  }

  // Atualizar mudança pendente de role
  function handleRoleChange(userId: string, newRole: UserRole) {
    setPendingChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        role: newRole
      }
    }));
  }

  // Atualizar mudança pendente de plano
  function handlePlanChange(userId: string, planId: string) {
    setPendingChanges(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        plan_id: planId
      }
    }));
  }

  // Salvar alterações de um usuário
  async function handleSaveChanges(userId: string) {
    const changes = pendingChanges[userId];
    if (!changes) return;

    setSavingUsers(prev => new Set(prev).add(userId));

    try {
      const promises: Promise<any>[] = [];

      // Atualizar role se mudou
      if (changes.role !== undefined) {
        promises.push(changeUserRole(userId, changes.role));
      }

      // Atualizar plano se mudou
      if (changes.plan_id !== undefined) {
        promises.push(assignPlanToUser(userId, changes.plan_id));
      }

      await Promise.all(promises);

      showSuccess('Alterações salvas com sucesso!');
      
      // Limpar mudanças pendentes deste usuário
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[userId];
        return newChanges;
      });

      // Recarregar dados
      await loadData();
    } catch (error) {
      showError('Erro ao salvar alterações');
    } finally {
      setSavingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
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
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold"
              >
                + Criar Usuário
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                ← Voltar
              </Link>
            </div>
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
              {filteredUsers.map((user) => {
                const hasPendingChanges = !!pendingChanges[user.id];
                const isSaving = savingUsers.has(user.id);
                const currentRole = pendingChanges[user.id]?.role ?? user.role;
                const currentPlanId = pendingChanges[user.id]?.plan_id ?? user.plan_id ?? '';

                return (
                  <tr key={user.id} className={hasPendingChanges ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={currentRole}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={currentPlanId}
                        onChange={(e) => handlePlanChange(user.id, e.target.value)}
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
                      {hasPendingChanges && (
                        <button
                          onClick={() => handleSaveChanges(user.id)}
                          disabled={isSaving}
                          className="text-green-600 hover:text-green-900 font-semibold disabled:opacity-50"
                          title="Salvar alterações"
                        >
                          {isSaving ? '...' : '💾 Salvar'}
                        </button>
                      )}
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
                );
              })}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Criar Novo Usuário</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <select
                  value={newUser.plan_id}
                  onChange={(e) => setNewUser({ ...newUser, plan_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Sem plano</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {creating ? 'Criando...' : 'Criar Usuário'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
