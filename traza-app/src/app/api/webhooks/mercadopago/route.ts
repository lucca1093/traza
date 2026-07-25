import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json()

    // Solo procesamos notificaciones de pago
    if (type !== 'payment') return NextResponse.json({ ok: true })

    const paymentId = data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    // Obtener detalle del pago
    const payment = new Payment(client)
    const pago = await payment.get({ id: paymentId })

    if (pago.status !== 'approved') return NextResponse.json({ ok: true })

    const { empresa, plan, period, seats } = (pago.metadata ?? {}) as any

    if (empresa && plan) {
      // Calcular vencimiento (30 días para mensual, 365 para anual)
      const dias = period === 'annual' ? 365 : 30
      const vencimiento = new Date()
      vencimiento.setDate(vencimiento.getDate() + dias)

      await supabaseAdmin
        .from('empresas')
        .update({
          plan,
          mp_payment_id:    String(paymentId),
          mp_payer_email:   pago.payer?.email ?? null,
          plan_activo_hasta: vencimiento.toISOString(),
          plan_seats:        Number(seats ?? 1),
        })
        .eq('nombre', empresa)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('MP webhook error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
