'use client';

import { useState } from 'react';
import { GlowButton } from '@/components/glow';
import { useCheckout } from '@/hooks/use-checkout';
import { Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  priceId: string;
  planName: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function CheckoutButton({ 
  priceId, 
  planName, 
  children, 
  className,
  variant = 'primary'
}: CheckoutButtonProps) {
  const { createCheckoutSession, loading, error } = useCheckout();

  const handleClick = async () => {
    await createCheckoutSession(priceId, planName);
  };

  return (
    <div className="w-full">
      <GlowButton
        onClick={handleClick}
        disabled={loading}
        className={className}
        variant={variant}
      >
        {loading ? (
          <span className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processando...</span>
          </span>
        ) : (
          children
        )}
      </GlowButton>
      
      {error && (
        <p className="text-red-400 text-sm mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
