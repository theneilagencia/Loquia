import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Product IDs e Price IDs (serão preenchidos após criação no Stripe)
export const STRIPE_PRODUCTS = {
  basic: {
    name: 'Basic',
    monthly: {
      priceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || '',
      amount: 5900, // $59.00 em centavos
    },
    yearly: {
      priceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || '',
      amount: 49560, // $495.60 em centavos (30% desconto)
    },
  },
  pro: {
    name: 'Pro',
    monthly: {
      priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
      amount: 7900, // $79.00 em centavos
    },
    yearly: {
      priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
      amount: 66360, // $663.60 em centavos (30% desconto)
    },
  },
  enterprise: {
    name: 'Enterprise',
    monthly: {
      priceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
      amount: 28000, // $280.00 em centavos
    },
    yearly: {
      priceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
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
export type BillingInterval = 'month' | 'year';
