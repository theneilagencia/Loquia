'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase-client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        // Login bem-sucedido - redirecionar para dashboard
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Mensagens de erro amigáveis em português
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Por favor, confirme seu email antes de fazer login');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-white/40" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
          Senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-white/40" />
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="ml-2 text-white/60">Lembrar de mim</span>
        </label>
        <Link 
          href="/auth/forgot-password" 
          className="text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          Esqueceu a senha?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 bg-emerald-500 text-black hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black glow-emerald-hover magnetic-button shine-effect disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
      >
        {loading ? 'Entrando...' : 'Entrar'}
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-black text-white/40">ou</span>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-white/60">
          Não tem uma conta?{' '}
          <Link 
            href="/auth/sign-up" 
            className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
          >
            Criar conta gratuita
          </Link>
        </p>
      </div>
    </form>
  );
}
