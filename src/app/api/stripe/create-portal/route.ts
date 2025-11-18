import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId é obrigatório' },
        { status: 400 }
      );
    }

    // Criar sessão do Customer Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Erro ao criar portal:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar portal' },
      { status: 500 }
    );
  }
}
