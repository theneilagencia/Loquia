import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { GlowButton, GlowCard } from '@/components/glow';
import { LanguageSwitcher } from '@/components/language-switcher';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default async function SuccessPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/${locale}`} className="text-2xl font-bold text-white">
              Loquia
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <GlowCard glow glowColor="green" className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pagamento Confirmado!
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Sua assinatura foi ativada com sucesso. Você receberá um email de confirmação em breve.
          </p>

          {session_id && (
            <p className="text-sm text-gray-400 mb-8">
              ID da sessão: {session_id}
            </p>
          )}

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Próximos Passos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-400 mb-2">1</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Configure sua Conta
                </h3>
                <p className="text-sm text-gray-400">
                  Complete seu perfil e configure suas preferências
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="text-3xl font-bold text-purple-400 mb-2">2</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Conecte suas Plataformas
                </h3>
                <p className="text-sm text-gray-400">
                  Integre Google Ads, Meta, TikTok e outras plataformas
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">3</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Comece a Otimizar
                </h3>
                <p className="text-sm text-gray-400">
                  Veja insights e comece a melhorar suas campanhas
                </p>
              </div>
            </div>

            <div className="mt-12">
              <Link href={`/${locale}/dashboard`}>
                <GlowButton size="lg" className="flex items-center space-x-2 mx-auto">
                  <span>Ir para Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </GlowButton>
              </Link>
            </div>
          </div>
        </GlowCard>

        {/* Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Precisa de ajuda? Nossa equipe está pronta para ajudar.
          </p>
          <Link href={`/${locale}/contact`}>
            <GlowButton variant="outline">
              Falar com Suporte
            </GlowButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
