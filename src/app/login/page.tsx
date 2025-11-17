"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loginAction } from "../actions/auth";

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
      const result = await loginAction(email, password);

      if (!result.success) {
        setError(result.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(`Erro inesperado: ${err.message}`);
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
          <p className="text-red-500 text-center bg-red-100 p-3 rounded-lg text-sm">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Seu email"
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffe066]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Sua senha"
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffe066]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-[#ffe066] hover:bg-[#ffd43b] text-black font-semibold p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="text-blue-600 underline hover:text-blue-700">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
