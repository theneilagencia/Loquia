"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting login for:", email);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        const errorMsg = data.error || "Erro ao fazer login";
        const errorCode = data.errorCode ? ` (${data.errorCode})` : "";
        const errorDetails = data.errorDetails ? ` - ${data.errorDetails}` : "";
        setError(`${errorMsg}${errorCode}${errorDetails}`);
        console.error("Login failed:", data);
        setLoading(false);
        return;
      }

      if (data.success && data.session) {
        // Store tokens in localStorage
        localStorage.setItem("sb-access-token", data.session.access_token);
        localStorage.setItem("sb-refresh-token", data.session.refresh_token);
        
        console.log("Login successful, redirecting to dashboard");
        
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError("Resposta inválida do servidor");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(`Erro de conexão: ${err.message}`);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] px-4">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image
          src="/images/logo-black.png"
          alt="Loquia"
          width={150}
          height={40}
          className="hover:opacity-80 transition-opacity"
          priority
        />
      </Link>

      <form
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col gap-6 border border-[#e0e0e0]"
      >
        <h1 className="text-3xl font-bold text-[#22223b] text-center mb-2">
          Entrar
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm font-medium">❌ {error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            placeholder="seu@email.com"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffe066] focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffe066] focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#ffe066] hover:bg-[#ffd43b] text-black font-semibold p-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Entrando...
            </span>
          ) : (
            "Entrar"
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Ainda não tem conta?{" "}
            <Link href="/signup" className="text-blue-600 font-medium underline hover:text-blue-700">
              Criar conta
            </Link>
          </p>
        </div>

        <div className="text-center pt-4 border-t">
          <Link href="/debug" className="text-xs text-gray-400 hover:text-gray-600">
            🔍 Página de Debug
          </Link>
        </div>
      </form>
    </div>
  );
}
