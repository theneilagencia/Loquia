import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Planos e preços
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 84,
    priceId: 'price_starter', // Substituir pelo Price ID real do Stripe
    features: [
      '3 campanhas',
      '2 plataformas',
      'Painel essencial',
      'Relatórios básicos',
      'Timeline simples'
    ]
  },
  professional: {
    name: 'Professional',
    price: 128,
    priceId: 'price_professional', // Substituir pelo Price ID real do Stripe
    features: [
      '10 campanhas',
      'Todas as plataformas conectadas',
      'Recomendações práticas',
      'Setup Center completo',
      'Exportações PDF/CSV',
      'Suporte prioritário'
    ]
  },
  advanced: {
    name: 'Advanced',
    price: 168,
    priceId: 'price_advanced', // Substituir pelo Price ID real do Stripe
    features: [
      'Mais campanhas',
      'Mais controles avançados',
      'Personalizações',
      'Tudo do Professional'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 420,
    priceId: 'price_enterprise', // Substituir pelo Price ID real do Stripe
    features: [
      'Campanhas ilimitadas',
      'Usuários ilimitados',
      'Multi-tenant',
      'API pública',
      'SLA',
      'White-label como addon'
    ]
  },
  premium: {
    name: 'Premium Loquia',
    price: 748,
    priceId: 'price_premium', // Substituir pelo Price ID real do Stripe
    features: [
      'Planejamento',
      'Estratégia',
      'Execução',
      'Monitoramento diário',
      'Reuniões mensais',
      'Relatórios estratégicos aprofundados'
    ]
  }
};

export const ADDONS = {
  diagnostico: {
    name: 'Diagnóstico Profissional',
    price: 11,
    priceId: 'price_diagnostico', // Substituir pelo Price ID real do Stripe
  },
  qualificacao: {
    name: 'Qualificação Telefônica Automática',
    price: 109,
    priceId: 'price_qualificacao', // Substituir pelo Price ID real do Stripe
  }
};
