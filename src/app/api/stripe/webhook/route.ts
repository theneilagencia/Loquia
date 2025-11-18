import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Assinatura ausente' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error('Erro ao verificar webhook:', error);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Registrar evento
  await supabaseAdmin.from('stripe_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event.data.object as any,
    processed: false,
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    // Marcar evento como processado
    await supabaseAdmin
      .from('stripe_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    
    // Registrar erro
    await supabaseAdmin
      .from('stripe_events')
      .update({ 
        processed: false,
        error_message: error.message 
      })
      .eq('stripe_event_id', event.id);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planName = session.metadata?.planName;
  const billingInterval = session.metadata?.billingInterval;

  if (!userId) {
    throw new Error('userId não encontrado no metadata');
  }

  // Buscar subscription criada
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  await upsertSubscription(subscription, userId, planName, billingInterval);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const planName = subscription.metadata?.planName;
  const billingInterval = subscription.metadata?.billingInterval;

  if (!userId) {
    console.warn('userId não encontrado no metadata da subscription');
    return;
  }

  await upsertSubscription(subscription, userId, planName, billingInterval);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | null;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Atualizar status para active
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', (subscription as any).id);

  // Registrar pagamento
  await supabaseAdmin.from('payment_history').insert({
    subscription_id: (await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()).data?.id,
    stripe_invoice_id: (invoice as any).id,
    stripe_payment_intent_id: (invoice as any).payment_intent as string,
    amount_paid: (invoice as any).amount_paid,
    currency: (invoice as any).currency,
    status: 'paid',
    paid_at: new Date((invoice as any).status_transitions.paid_at! * 1000).toISOString(),
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | null;
  if (!subscriptionId) return;

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', subscriptionId);
}

async function upsertSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  planName?: string,
  billingInterval?: string
) {
  const subscriptionData = {
    user_id: userId,
    tenant_id: userId,
    stripe_subscription_id: (subscription as any).id,
    stripe_customer_id: (subscription as any).customer as string,
    stripe_product_id: (subscription as any).items.data[0].price.product as string,
    stripe_price_id: (subscription as any).items.data[0].price.id,
    customer_email: (await stripe.customers.retrieve((subscription as any).customer as string) as Stripe.Customer).email!,
    plan_name: planName || 'basic',
    billing_interval: billingInterval || (subscription as any).items.data[0].price.recurring?.interval || 'month',
    status: (subscription as any).status,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    cancel_at: (subscription as any).cancel_at ? new Date((subscription as any).cancel_at * 1000).toISOString() : null,
    canceled_at: (subscription as any).canceled_at ? new Date((subscription as any).canceled_at * 1000).toISOString() : null,
    trial_start: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000).toISOString() : null,
    trial_end: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000).toISOString() : null,
    metadata: (subscription as any).metadata as any,
  };

  // Upsert subscription
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Erro ao upsert subscription:', error);
    throw error;
  }
}

// Configurar para aceitar raw body
export const config = {
  api: {
    bodyParser: false,
  },
};
