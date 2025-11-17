"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // sucesso → redireciona
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col gap-6 border border-[#e0e0e0]"
      >
        <h1 className="text-3xl font-bold text-[#22223b] text-center mb-2">
          Entrar
        </h1>

        {error && (
          <p className="text-red-500 text-center bg-red-100 p-2 rounded">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Seu email"
          className="border p-3 rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Sua senha"
          className="border p-3 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[#ffe066] hover:bg-[#ffd43b] text-black font-semibold p-3 rounded-lg transition"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Ainda não tem conta?{" "}
          <a href="/signup" className="text-blue-600 underline">
            Criar conta
          </a>
        </p>
      </form>
    </div>
  );
}
