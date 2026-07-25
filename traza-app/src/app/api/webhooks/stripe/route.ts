import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    return NextResponse.json({ error: `Webhook error: ${e.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { empresa, plan, period, seats } = session.metadata ?? {}

    if (empresa && plan) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const periodEnd = new Date((sub as any).current_period_end * 1000).toISOString()

      await supabaseAdmin
        .from('empresas')
        .update({
          plan,
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan_activo_hasta:      periodEnd,
          plan_seats:             Number(seats ?? 1),
        })
        .eq('nombre', empresa)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await supabaseAdmin
      .from('empresas')
      .update({ plan: 'free', stripe_subscription_id: null, plan_activo_hasta: null })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const periodEnd = new Date((sub as any).current_period_end * 1000).toISOString()
    await supabaseAdmin
      .from('empresas')
      .update({ plan_activo_hasta: periodEnd })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
