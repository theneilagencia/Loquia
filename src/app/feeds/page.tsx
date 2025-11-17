"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import { useToast } from "../contexts/ToastContext";

interface Feed {
  id: string;
  tenant_id: string;
  feed_type: string;
  feed_content: any;
  created_at: string;
}

export default function FeedsPage() {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useToast();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    checkUser();
    loadFeeds();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
    }
  }

  async function loadFeeds() {
    try {
      const { data, error } = await supabase
        .from("feeds")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeeds(data || []);
    } catch (error) {
      console.error("Erro ao carregar feeds:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateFeeds() {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/workflows/generate-feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Erro ao gerar feeds");
        if (data.error?.includes("intenções")) {
          setTimeout(() => router.push("/intent"), 2000);
        }
        return;
      }

      showSuccess(data.message);
      if (data.note) {
        showInfo(data.note);
      }
      
      // Recarregar feeds após alguns segundos
      setTimeout(() => {
        loadFeeds();
      }, 2000);
      
    } catch (error: any) {
      showError("Erro: " + error.message);
    } finally {
      setGenerating(false);
    }
  }

  async function deleteFeed(id: string) {
    if (!confirm("Tem certeza que deseja excluir este feed?")) return;

    try {
      const { error } = await supabase
        .from("feeds")
        .delete()
        .eq("id", id);

      if (error) throw error;
      showSuccess("Feed excluído com sucesso!");
      loadFeeds();
    } catch (error: any) {
      showError("Erro ao excluir: " + error.message);
    }
  }

  async function downloadFeed(feed: Feed) {
    const blob = new Blob([JSON.stringify(feed.feed_content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${feed.feed_type}_feed_${new Date(feed.created_at).toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess("Feed baixado com sucesso!");
  }

  const filteredFeeds = filterType === "all" 
    ? feeds 
    : feeds.filter(f => f.feed_type === filterType);

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
            <h1 className="text-2xl font-bold text-gray-900">Feeds</h1>
          </div>
          <Button
            onClick={generateFeeds}
            disabled={generating}
            className="bg-yellow-400 hover:bg-yellow-500 text-black disabled:opacity-50"
          >
            {generating ? "Gerando..." : "🤖 Gerar Feeds"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-900">
            <strong>Como funciona:</strong> Os feeds são gerados a partir das suas intenções e otimizados para OpenAI e Perplexity. 
            Eles permitem que IAs descubram e recomendem seus produtos/serviços.
          </p>
        </div>

        {/* Filter Tabs */}
        {feeds.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterType === "all"
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Todos ({feeds.length})
            </button>
            <button
              onClick={() => setFilterType("openai")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterType === "openai"
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              OpenAI ({feeds.filter(f => f.feed_type === "openai").length})
            </button>
            <button
              onClick={() => setFilterType("perplexity")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterType === "perplexity"
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Perplexity ({feeds.filter(f => f.feed_type === "perplexity").length})
            </button>
          </div>
        )}

        {/* Feeds List */}
        {filteredFeeds.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              {filterType === "all" 
                ? "Nenhum feed gerado ainda." 
                : `Nenhum feed ${filterType} encontrado.`}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Clique no botão acima para gerar feeds automaticamente a partir das suas intenções.
            </p>
            <Button
              onClick={generateFeeds}
              disabled={generating}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              {generating ? "Gerando..." : "Gerar Primeiro Feed"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeeds.map((feed) => (
              <div
                key={feed.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg capitalize">
                        Feed {feed.feed_type}
                      </h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        feed.feed_type === "openai" 
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {feed.feed_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Criado em {new Date(feed.created_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(feed.created_at).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadFeed(feed)}
                      className="text-sm py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      📥 Baixar
                    </button>
                    <button
                      onClick={() => setSelectedFeed(selectedFeed?.id === feed.id ? null : feed)}
                      className="text-sm py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      {selectedFeed?.id === feed.id ? "Ocultar" : "Ver JSON"}
                    </button>
                    <button
                      onClick={() => deleteFeed(feed.id)}
                      className="text-sm py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Feed Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Conteúdo:</strong> {JSON.stringify(feed.feed_content).length} caracteres
                  </p>
                </div>

                {/* Expanded JSON */}
                {selectedFeed?.id === feed.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(feed.feed_content, null, 2)}
                    </pre>
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
