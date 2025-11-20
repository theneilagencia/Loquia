"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriptionWarning, setSubscriptionWarning] = useState("");

  // Capturar parâmetros de plano da URL
  const redirect = searchParams.get('redirect');
  const plan = searchParams.get('plan');
  const billing = searchParams.get('billing');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubscriptionWarning("");
    setLoading(true);

    console.log("🔐 Attempting login...", { email });

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error("❌ Login error:", signInError);
        const errorMessage = signInError.message || 'Erro ao fazer login';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!data) {
        console.error("❌ No data returned");
        setError("Erro ao fazer login - sem resposta do servidor");
        setLoading(false);
        return;
      }

      if (!data.session) {
        console.error("❌ No session created");
        setError("Falha ao criar sessão");
        setLoading(false);
        return;
      }

      console.log("✅ Login successful!", data.user?.email);
      
      // Save tokens to cookies for middleware
      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=604800`;
        console.log("🍪 Cookies saved!");
      }
      
      // Se há um plano selecionado, redirecionar para checkout
      if (plan && billing && data.user) {
        console.log("🛒 Redirecting to checkout...", { plan, billing });
        window.location.href = `/billing/checkout?plan=${plan}&billing=${billing}`;
        return;
      }

      // Verificar se usuário tem subscription ativa
      console.log("🔍 Checking subscription status...");
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('status', 'active')
        .single();

      if (subError || !subscriptionData) {
        console.log("⚠️ No active subscription found");
        setSubscriptionWarning(
          "Você não possui um plano ativo. Para acessar a plataforma Loquia, é necessário assinar um de nossos planos."
        );
        setLoading(false);
        return;
      }

      console.log("✅ Active subscription found:", subscriptionData.plan_name);

      // Caso contrário, redirecionar para dashboard ou URL especificada
      const redirectUrl = redirect || '/dashboard';
      window.location.href = redirectUrl;
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setError("Erro inesperado ao fazer login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <img
            src="/logo.png"
            alt="Loquia"
            className="h-10 w-auto hover:opacity-80 transition-opacity"
          />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Entrar na sua conta
        </h2>
        {plan && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Você selecionou o plano <span className="font-semibold text-yellow-600">{plan.toUpperCase()}</span>
          </p>
        )}
      </div>

      {/* Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Warning */}
            {subscriptionWarning && (
              <div className="rounded-md bg-yellow-50 border-2 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Plano necessário
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{subscriptionWarning}</p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href="/pricing"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Ver planos disponíveis
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  plan ? "Entrar e continuar para checkout" : "Entrar"
                )}
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Ainda não tem conta?{" "}
                  <Link
                    href={plan && billing ? `/signup?plan=${plan}&billing=${billing}` : "/signup"}
                    className="font-medium text-yellow-600 hover:text-yellow-500"
                  >
                    Criar conta
                  </Link>
                </span>
              </div>
            </div>
          </div>

          {/* Debug Link */}
          <div className="mt-4 text-center">
            <Link
              href="/debug"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              🔍 Página de Debug
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
