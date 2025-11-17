"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";
import Onboarding from "../components/ui/Onboarding";

interface Stats {
  catalogCount: number;
  intentCount: number;
  feedCount: number;
}

interface Intent {
  id: string;
  tenant_id: string;
  primary_intent: string;
  variations: string[];
  created_at: string;
}

interface Feed {
  id: string;
  tenant_id: string;
  feed_type: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ catalogCount: 0, intentCount: 0, feedCount: 0 });
  const [recentIntents, setRecentIntents] = useState<Intent[]>([]);
  const [recentFeeds, setRecentFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkUser();
    loadDashboardData();
    checkFirstTime();
  }, []);

  function checkFirstTime() {
    const hasSeenOnboarding = localStorage.getItem("loquia_onboarding_completed");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }

  function completeOnboarding() {
    localStorage.setItem("loquia_onboarding_completed", "true");
    setShowOnboarding(false);
  }

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
  }

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar estatísticas
      const [catalogData, intentData, feedData] = await Promise.all([
        supabase.from("catalog").select("*", { count: "exact", head: true }),
        supabase.from("intent_graph").select("*", { count: "exact", head: true }),
        supabase.from("feeds").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        catalogCount: catalogData.count || 0,
        intentCount: intentData.count || 0,
        feedCount: feedData.count || 0,
      });

      // Buscar intenções recentes
      const { data: intents } = await supabase
        .from("intent_graph")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentIntents(intents || []);

      // Buscar feeds recentes
      const { data: feeds } = await supabase
        .from("feeds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentFeeds(feeds || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function optimizeIntents() {
    setOptimizing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/workflows/optimize-intents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Erro ao otimizar intenções");
        return;
      }

      showSuccess(data.message);
      
      // Recarregar dados após otimização
      setTimeout(() => {
        loadDashboardData();
      }, 2000);
      
    } catch (error: any) {
      showError("Erro: " + error.message);
    } finally {
      setOptimizing(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Loquia Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button onClick={logout} className="bg-gray-900 hover:bg-gray-800">
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Itens no Catálogo</p>
                <p className="text-3xl font-bold text-gray-900">{stats.catalogCount}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => router.push("/catalog")}
              className="mt-4 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Gerenciar catálogo →
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Intenções Criadas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.intentCount}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => router.push("/intent")}
              className="mt-4 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Ver intenções →
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Feeds Gerados</p>
                <p className="text-3xl font-bold text-gray-900">{stats.feedCount}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <button
              onClick={() => router.push("/feeds")}
              className="mt-4 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Ver feeds →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Ações Rápidas</h2>
            {stats.intentCount > 0 && (
              <button
                onClick={optimizeIntents}
                disabled={optimizing}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition disabled:opacity-50"
              >
                {optimizing ? "⚡ Otimizando..." : "⚡ Otimizar Intenções"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/catalog")}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-left"
            >
              <p className="font-semibold text-gray-900 mb-1">Adicionar ao Catálogo</p>
              <p className="text-sm text-gray-600">Adicione produtos ou serviços</p>
            </button>

            <button
              onClick={() => router.push("/intent")}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-left"
            >
              <p className="font-semibold text-gray-900 mb-1">Criar Intenção</p>
              <p className="text-sm text-gray-600">Gere novas intenções com IA</p>
            </button>

            <button
              onClick={() => router.push("/feeds")}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition text-left"
            >
              <p className="font-semibold text-gray-900 mb-1">Gerar Feeds</p>
              <p className="text-sm text-gray-600">Crie feeds para OpenAI e Perplexity</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Intents */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Intenções Recentes</h2>
            {recentIntents.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhuma intenção criada ainda.</p>
            ) : (
              <div className="space-y-3">
                {recentIntents.map((intent) => (
                  <div key={intent.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm mb-1">
                      {intent.primary_intent}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(intent.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Feeds */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Feeds Recentes</h2>
            {recentFeeds.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum feed gerado ainda.</p>
            ) : (
              <div className="space-y-3">
                {recentFeeds.map((feed) => (
                  <div key={feed.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm capitalize">
                        {feed.feed_type}
                      </p>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {feed.feed_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(feed.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
