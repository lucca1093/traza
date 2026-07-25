import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

// Precio en ARS según plan y período
const PRECIOS: Record<string, Record<string, number>> = {
  pro: {
    monthly: Number(process.env.MP_PRECIO_PRO_MENSUAL ?? 15000),
    annual:  Number(process.env.MP_PRECIO_PRO_ANUAL  ?? 135000),
  },
}

const LABELS: Record<string, Record<string, string>> = {
  pro: { monthly: 'TRAZA Pro — Mensual', annual: 'TRAZA Pro — Anual' },
}

export async function POST(req: NextRequest) {
  try {
    const { plan, period, empresa, email, seats } = await req.json()

    const unitPrice = PRECIOS[plan]?.[period]
    if (!unitPrice) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })

    const origin = req.headers.get('origin') ?? 'https://traza-three.vercel.app'
    const preference = new Preference(client)

    const response = await preference.create({
      body: {
        items: [{
          id:          `${plan}-${period}`,
          title:       LABELS[plan][period],
          quantity:    seats ?? 1,
          unit_price:  unitPrice,
          currency_id: 'ARS',
        }],
        payer:      { email },
        metadata:   { empresa, plan, period, seats: seats ?? 1 },
        back_urls: {
          success: `${origin}/pago-exitoso`,
          failure: `${origin}/checkout?plan=${plan}&period=${period}&error=1`,
          pending: `${origin}/pago-exitoso?pending=1`,
        },
        auto_return:      'approved',
        notification_url: `${origin}/api/webhooks/mercadopago`,
        statement_descriptor: 'TRAZA',
      },
    })

    return NextResponse.json({ url: response.init_point })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
