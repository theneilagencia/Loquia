'use client';

import { GlowCard, GlowButton } from '@/components/glow';
import { CheckoutButton } from '@/components/checkout-button';
import { CheckCircle2, LucideIcon } from 'lucide-react';
import { PLANS } from '@/lib/stripe';

interface PricingCardProps {
  planId: 'starter' | 'professional' | 'advanced' | 'enterprise' | 'premium';
  planData: any;
  icon: LucideIcon;
  color: string;
  isPopular: boolean;
  locale: string;
}

export function PricingCard({ 
  planId, 
  planData, 
  icon: Icon, 
  color, 
  isPopular,
  locale 
}: PricingCardProps) {
  const stripePlan = PLANS[planId];

  return (
    <GlowCard 
      glow={isPopular}
      glowColor={color as any}
      className={`relative ${isPopular ? 'border-purple-500/50' : ''}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            {planData.badge}
          </div>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${color}-500/10 mb-4`}>
          <Icon className={`w-8 h-8 text-${color}-400`} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {planData.name}
        </h3>
        <div className="flex items-baseline justify-center mb-2">
          <span className="text-gray-400 text-sm">USD</span>
          <span className="text-5xl font-bold text-white mx-2">
            {planData.price}
          </span>
          <span className="text-gray-400 text-sm">/mês</span>
        </div>
        <p className="text-sm text-gray-400 italic">
          {planData.tagline}
        </p>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-6">
        {planData.description}
      </p>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {planData.features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start space-x-2">
            <CheckCircle2 className={`w-5 h-5 text-${color}-400 flex-shrink-0 mt-0.5`} />
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA with Stripe */}
      {planId === 'premium' ? (
        // Premium plan - contact sales
        <a href={`/${locale}/contact`}>
          <GlowButton 
            className="w-full"
            variant="outline"
          >
            {planData.cta}
          </GlowButton>
        </a>
      ) : (
        // Other plans - Stripe checkout
        <CheckoutButton
          priceId={stripePlan.priceId}
          planName={stripePlan.name}
          variant={isPopular ? 'primary' : 'outline'}
          className="w-full"
        >
          {planData.cta}
        </CheckoutButton>
      )}
    </GlowCard>
  );
}
