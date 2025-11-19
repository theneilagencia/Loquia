// Configurações do Stripe para uso no client-side
// Não inclui inicialização do Stripe (apenas dados públicos)

export const STRIPE_PRODUCTS = {
  basic: {
    name: 'Basic',
    monthly: {
      priceId: 'price_1SUue7GwHsvLMl1q5vRvBRXe',
      amount: 5900, // $59.00 em centavos
    },
    yearly: {
      priceId: 'price_1SUue7GwHsvLMl1qYEUocMGk',
      amount: 49560, // $495.60 em centavos (30% desconto)
    },
  },
  pro: {
    name: 'Pro',
    monthly: {
      priceId: 'price_1SUue8GwHsvLMl1q7Q2slbJc',
      amount: 7900, // $79.00 em centavos
    },
    yearly: {
      priceId: 'price_1SUue8GwHsvLMl1qh7x8nYNM',
      amount: 66360, // $663.60 em centavos (30% desconto)
    },
  },
  enterprise: {
    name: 'Enterprise',
    monthly: {
      priceId: 'price_1SUue8GwHsvLMl1quBUbjtSy',
      amount: 28000, // $280.00 em centavos
    },
    yearly: {
      priceId: 'price_1SUue9GwHsvLMl1qP55ToPYX',
      amount: 235200, // $2352.00 em centavos (30% desconto)
    },
  },
};

export const PLAN_FEATURES = {
  basic: [
    'Presença em OpenAI e Perplexity',
    'Até 10 intenções',
    'Feeds básicos',
    'Dashboard de analytics',
    'Suporte por email',
  ],
  pro: [
    'Presença em todas as IAs (OpenAI, Perplexity, Claude, SGE)',
    'Até 50 intenções',
    'Feeds otimizados',
    'Intent Proof Dashboard™',
    'Analytics avançados',
    'Suporte prioritário',
  ],
  enterprise: [
    'Presença ilimitada em todas as IAs',
    'Intenções ilimitadas',
    'Feeds customizados',
    'Intent Proof Dashboard™ completo',
    'API de integração',
    'Otimização diária',
    'Suporte dedicado 24/7',
    'Consultoria estratégica',
  ],
};

export type PlanName = 'basic' | 'pro' | 'enterprise';
export type BillingInterval = 'monthly' | 'yearly';
