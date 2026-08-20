import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { email, url, tituloObjetivo, nombreRemitente } = await req.json()
    if (!email || !url) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'TRAZA <lucca@trazaid.com>'

    await resend.emails.send({
      from:     fromEmail,
      reply_to: fromEmail,
      to:       email.trim(),
      subject:  `${nombreRemitente || 'Alguien'} te pide que valides su trabajo`,
      text:     `Hola,\n\n${nombreRemitente || 'Un colega'} te pide que evalúes su trabajo en:\n"${tituloObjetivo ?? 'un objetivo'}"\n\nSolo toma 2 minutos:\n${url}\n\nSi no conocés a esta persona, ignorá este mensaje.\n\n${nombreRemitente || 'TRAZA'}`,
      html:     `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#1a1a1a;font-size:15px;line-height:1.7;">
<p>Hola,</p>
<p>${nombreRemitente || 'Un colega'} te pide que evalúes el trabajo que hizo en:</p>
<p style="margin:20px 0;padding:12px 16px;border-left:3px solid #ccc;color:#333;font-style:italic;">${tituloObjetivo ?? 'un objetivo'}</p>
<p>Solo toma 2 minutos. Podés responder acá:</p>
<p><a href="${url}" style="color:#1C2B90;">${url}</a></p>
<p>Si no conocés a esta persona, ignorá este mensaje.</p>
<p style="margin-top:32px;color:#555;">${nombreRemitente || 'TRAZA'}</p>
</div>`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('enviar-validacion error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
