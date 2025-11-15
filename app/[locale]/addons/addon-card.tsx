'use client';

import { GlowCard } from '@/components/glow';
import { CheckoutButton } from '@/components/checkout-button';
import { CheckCircle2, LucideIcon } from 'lucide-react';
import { ADDONS } from '@/lib/stripe';

interface AddonCardProps {
  addonId: 'diagnostico' | 'qualificacao';
  addonData: any;
  icon: LucideIcon;
  color: string;
  currency: string;
  perMonth: string;
}

export function AddonCard({ 
  addonId, 
  addonData, 
  icon: Icon, 
  color,
  currency,
  perMonth
}: AddonCardProps) {
  const stripeAddon = ADDONS[addonId];

  return (
    <GlowCard 
      glow
      glowColor={color as any}
      className="relative"
    >
      {/* Addon Header */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${color}-500/10 mb-4`}>
          <Icon className={`w-8 h-8 text-${color}-400`} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {addonData.name}
        </h3>
        <div className="flex items-baseline justify-center mb-2">
          <span className="text-gray-400 text-sm">{currency}</span>
          <span className="text-5xl font-bold text-white mx-2">
            {addonData.price}
          </span>
          <span className="text-gray-400 text-sm">{perMonth}</span>
        </div>
        <p className="text-sm text-gray-400 italic">
          {addonData.tagline}
        </p>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-6">
        {addonData.description}
      </p>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {addonData.features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start space-x-2">
            <CheckCircle2 className={`w-5 h-5 text-${color}-400 flex-shrink-0 mt-0.5`} />
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* For Who */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">{addonData.for_who_label}</span> {addonData.for_who}
        </p>
      </div>

      {/* CTA with Stripe */}
      <CheckoutButton
        priceId={stripeAddon.priceId}
        planName={stripeAddon.name}
        variant="primary"
        className="w-full"
      >
        {addonData.cta}
      </CheckoutButton>
    </GlowCard>
  );
}
