"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DebugPage() {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    async function checkConfig() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const debugInfo = {
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
              <p><strong>Sessão Atual:</strong> {info.currentSession}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Timestamp</h2>
            <p className="text-gray-600">{info.timestamp}</p>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Configuração Esperada:</h3>
            <div className="text-sm space-y-1">
              <p><strong>URL:</strong> https://ixqhqzwdqmqjkwvwqvqo.supabase.co</p>
              <p><strong>Key:</strong> Deve começar com "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."</p>
            </div>
          </div>

          <div className="mt-4">
            <a 
              href="/login" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              ← Voltar para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
