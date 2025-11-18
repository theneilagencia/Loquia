"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "../contexts/ToastContext";

interface IAStatus {
  id: string;
  ia_name: string;
  status: string;
  response_time_ms: number;
  last_check: string;
}

interface IntentActivation {
  id: string;
  user_query: string;
  ia_name: string;
  confidence_score: number;
  created_at: string;
}

interface Lead {
  id: string;
  source_ia: string;
  user_query: string;
  status: string;
  created_at: string;
}

interface RealtimeEvent {
  id: string;
  event_type: string;
  ia_name: string;
  description: string;
  created_at: string;
}

interface Analytics {
  totalActivations: number;
  totalLeads: number;
  totalQueries: number;
  topIntent: string;
}

export default function IntentProofDashboard() {
  const router = useRouter();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Estados
  const [iaStatus, setIaStatus] = useState<IAStatus[]>([]);
  const [activations, setActivations] = useState<IntentActivation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalActivations: 0,
    totalLeads: 0,
    totalQueries: 0,
    topIntent: "Nenhuma intenção ativada ainda"
  });

  useEffect(() => {
    checkUser();
    loadData();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
    }
  }

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar status das IAs
      const { data: statusData } = await supabase
        .from("ia_status")
        .select("*")
        .order("ia_name");
      
      if (statusData) setIaStatus(statusData);

      // Carregar ativações recentes
      const { data: activationsData } = await supabase
        .from("intent_activations")
        .select("*")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (activationsData) setActivations(activationsData);

      // Carregar leads
      const { data: leadsData } = await supabase
        .from("leads")
        .select("*")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (leadsData) setLeads(leadsData);

      // Carregar eventos em tempo real
      const { data: eventsData } = await supabase
        .from("realtime_events")
        .select("*")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (eventsData) setEvents(eventsData);

      // Calcular analytics
      const { count: activationsCount } = await supabase
        .from("intent_activations")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", user.id);

      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", user.id);

      const { count: queriesCount } = await supabase
        .from("ia_feed_queries")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", user.id);

      setAnalytics({
        totalActivations: activationsCount || 0,
        totalLeads: leadsCount || 0,
        totalQueries: queriesCount || 0,
        topIntent: "Nenhuma intenção ativada ainda"
      });

      setLoading(false);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      showError("Erro ao carregar dados: " + error.message);
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "healthy": return "bg-green-500";
      case "degraded": return "bg-yellow-500";
      case "down": return "bg-red-500";
      default: return "bg-gray-500";
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "healthy": return "Saudável";
      case "degraded": return "Degradado";
      case "down": return "Fora do ar";
      default: return "Desconhecido";
    }
  }

  function getIAIcon(iaName: string) {
    switch (iaName) {
      case "openai": return "🤖";
      case "perplexity": return "🔮";
      case "claude": return "🧠";
      case "sgie": return "⚡";
      default: return "🤖";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Intent Proof Dashboard™...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Intent Proof Dashboard™
          </h1>
          <p className="text-gray-600">
            A comprovação que o cliente precisa. Não adianta prometer. Precisamos mostrar.
          </p>
        </div>

        {/* Status das IAs */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status da presença IA</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {iaStatus.map((ia) => (
              <div key={ia.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{getIAIcon(ia.ia_name)}</span>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(ia.status)}`}></div>
                </div>
                <h3 className="font-bold text-gray-900 capitalize mb-1">{ia.ia_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{getStatusText(ia.status)}</p>
                <p className="text-xs text-gray-500">{ia.response_time_ms}ms</p>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics completos</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Intenções Ativadas</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalActivations}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Leads Gerados</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalLeads}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Consultas ao Feed</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalQueries}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Intenção Mais Acionada</p>
              <p className="text-sm font-semibold text-gray-900">{analytics.topIntent}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Logs de Intenção Ativada */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Logs de intenção ativada</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {activations.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Nenhuma intenção ativada ainda.
                </p>
              ) : (
                <div className="space-y-4">
                  {activations.map((activation) => (
                    <div key={activation.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {activation.user_query}
                        </p>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {activation.ia_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Confiança: {(activation.confidence_score * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activation.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leads Capturados */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Leads capturados</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {leads.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Nenhum lead capturado ainda.
                </p>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.user_query || "Sem query"}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Origem: {lead.source_ia}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monitor em Tempo Real */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monitor em tempo real</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {events.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nenhum evento registrado ainda.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-gray-900">{event.description}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(event.created_at).toLocaleTimeString("pt-BR")}
                        </span>
                      </div>
                      {event.ia_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          {getIAIcon(event.ia_name)} {event.ia_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mensagem Final */}
        <div className="mt-8 bg-black text-white rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">
            O Intent Proof Dashboard™ é o que transforma a Loquia em prova viva
          </h3>
          <p className="text-gray-300">
            e o mensal em decisão óbvia.
          </p>
        </div>
      </main>
    </div>
  );
}
