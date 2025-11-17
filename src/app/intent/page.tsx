"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";

interface Intent {
  id: string;
  tenant_id: string;
  primary_intent: string;
  variations: string[];
  embedding: number[];
  created_at: string;
}

export default function IntentPage() {
  const router = useRouter();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);

  useEffect(() => {
    checkUser();
    loadIntents();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
    }
  }

  async function loadIntents() {
    try {
      const { data, error } = await supabase
        .from("intent_graph")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIntents(data || []);
    } catch (error) {
      console.error("Erro ao carregar intenções:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateIntents() {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/workflows/generate-intents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Erro ao gerar intenções");
        if (data.error?.includes("catálogo")) {
          router.push("/catalog");
        }
        return;
      }

      alert(data.message + "\n\n" + (data.note || ""));
      
      // Recarregar intenções após alguns segundos
      setTimeout(() => {
        loadIntents();
      }, 2000);
      
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setGenerating(false);
    }
  }

  async function deleteIntent(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta intenção?")) return;

    try {
      const { error } = await supabase
        .from("intent_graph")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadIntents();
    } catch (error: any) {
      alert("Erro ao excluir: " + error.message);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Intenções</h1>
          </div>
          <Button
            onClick={generateIntents}
            disabled={generating}
            className="bg-yellow-400 hover:bg-yellow-500 text-black disabled:opacity-50"
          >
            {generating ? "Gerando..." : "🤖 Gerar Intenções"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-900">
            <strong>Como funciona:</strong> As intenções são geradas automaticamente a partir do seu catálogo usando IA. 
            Cada intenção representa uma forma como usuários podem buscar seus produtos/serviços.
          </p>
        </div>

        {/* Intents List */}
        {intents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">Nenhuma intenção gerada ainda.</p>
            <p className="text-sm text-gray-500 mb-6">
              Clique no botão acima para gerar intenções automaticamente a partir do seu catálogo.
            </p>
            <Button
              onClick={generateIntents}
              disabled={generating}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              {generating ? "Gerando..." : "Gerar Primeira Intenção"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {intents.map((intent) => (
              <div
                key={intent.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      {intent.primary_intent}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Criado em {new Date(intent.created_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(intent.created_at).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedIntent(selectedIntent?.id === intent.id ? null : intent)}
                      className="text-sm py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      {selectedIntent?.id === intent.id ? "Ocultar" : "Ver Detalhes"}
                    </button>
                    <button
                      onClick={() => deleteIntent(intent.id)}
                      className="text-sm py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Variations */}
                {intent.variations && intent.variations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Variações:</p>
                    <div className="flex flex-wrap gap-2">
                      {intent.variations.map((variation, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-700"
                        >
                          {variation}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {selectedIntent?.id === intent.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">ID:</p>
                        <p className="text-xs text-gray-600 font-mono">{intent.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Tenant ID:</p>
                        <p className="text-xs text-gray-600 font-mono">{intent.tenant_id}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Embedding:</p>
                        <p className="text-xs text-gray-600">
                          {intent.embedding ? `Vetor de ${intent.embedding.length} dimensões` : "Não disponível"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
