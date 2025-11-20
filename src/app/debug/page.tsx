"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DebugPage() {
  const [info, setInfo] = useState<any>({});
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    async function checkConfig() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const debugInfo: any = {
        supabaseUrl: url || "NOT SET",
        supabaseKeyLength: key ? key.length : 0,
        supabaseKeyPrefix: key ? key.substring(0, 20) + "..." : "NOT SET",
        timestamp: new Date().toISOString(),
      };

      // Test connection
      try {
        const { data, error } = await supabase.auth.getSession();
        debugInfo.connectionTest = error ? `Error: ${error.message}` : "OK";
        debugInfo.currentSession = data.session ? "Active" : "None";
        
        // Se há sessão, buscar informações do usuário
        if (data.session?.user) {
          debugInfo.userId = data.session.user.id;
          debugInfo.userEmail = data.session.user.email;
          
          // Buscar profile do usuário
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
          
          if (!profileError && profile) {
            setUserProfile(profile);
          }
          
          // Buscar subscription do usuário
          const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', data.session.user.id)
            .single();
          
          if (!subError && subscription) {
            debugInfo.subscription = subscription;
          }
        }
      } catch (err: any) {
        debugInfo.connectionTest = `Failed: ${err.message}`;
      }

      setInfo(debugInfo);
    }

    checkConfig();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug - Configurações Supabase</h1>
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">Variáveis de Ambiente</h2>
            <div className="bg-gray-50 p-4 rounded font-mono text-sm">
              <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong></p>
              <p className="text-blue-600">{info.supabaseUrl}</p>
              
              <p className="mt-4"><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong></p>
              <p className="text-blue-600">{info.supabaseKeyPrefix}</p>
              <p className="text-gray-500">Length: {info.supabaseKeyLength} characters</p>
            </div>
          </div>

          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">Teste de Conexão</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p><strong>Status:</strong> <span className={info.connectionTest === "OK" ? "text-green-600" : "text-red-600"}>{info.connectionTest}</span></p>
              <p><strong>Sessão Atual:</strong> <span className={info.currentSession === "Active" ? "text-green-600" : "text-gray-600"}>{info.currentSession}</span></p>
              {info.userEmail && (
                <>
                  <p className="mt-2"><strong>User ID:</strong> <span className="text-xs text-gray-600">{info.userId}</span></p>
                  <p><strong>Email:</strong> {info.userEmail}</p>
                </>
              )}
            </div>
          </div>

          {userProfile && (
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">User Profile</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Role:</strong> <span className={
                  userProfile.role === 'admin' || userProfile.role === 'superadmin' 
                    ? "text-purple-600 font-bold" 
                    : "text-gray-600"
                }>{userProfile.role?.toUpperCase()}</span></p>
                <p><strong>Full Name:</strong> {userProfile.full_name || "Not set"}</p>
                <p><strong>Active:</strong> {userProfile.is_active ? "✅ Yes" : "❌ No"}</p>
                <p><strong>Created:</strong> {new Date(userProfile.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {info.subscription && (
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold mb-2">Subscription</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Plan:</strong> {info.subscription.plan_name}</p>
                <p><strong>Status:</strong> <span className={
                  info.subscription.status === 'active' 
                    ? "text-green-600 font-bold" 
                    : "text-red-600"
                }>{info.subscription.status?.toUpperCase()}</span></p>
                <p><strong>Stripe Customer ID:</strong> <span className="text-xs">{info.subscription.stripe_customer_id}</span></p>
                <p><strong>Stripe Subscription ID:</strong> <span className="text-xs">{info.subscription.stripe_subscription_id}</span></p>
              </div>
            </div>
          )}

          {info.currentSession === "Active" && !info.subscription && userProfile?.role === 'user' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Aviso:</h3>
              <p className="text-sm text-yellow-700">
                Você está logado mas não possui uma subscription ativa. 
                Para acessar o dashboard, você precisa assinar um plano.
              </p>
              <Link 
                href="/pricing"
                className="inline-block mt-3 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Ver Planos
              </Link>
            </div>
          )}

          {info.currentSession === "Active" && (userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded">
              <h3 className="font-semibold text-purple-800 mb-2">👑 Admin Access:</h3>
              <p className="text-sm text-purple-700">
                Você tem privilégios de {userProfile.role} e pode acessar a plataforma sem subscription.
              </p>
              <Link 
                href="/dashboard"
                className="inline-block mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Ir para Dashboard
              </Link>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-2">Timestamp</h2>
            <p className="text-gray-600">{info.timestamp}</p>
          </div>

          <div className="mt-4 flex gap-4">
            <Link 
              href="/login" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              ← Voltar para Login
            </Link>
            
            {info.currentSession === "Active" && (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
              >
                Fazer Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
