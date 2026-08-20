import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generarToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join('')
}

// POST /api/feedback-cliente
// action='solicitar': envía email al cliente con link para dar feedback
// action='responder': el cliente envía su puntuación y comentario (via página pública)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body
    const admin = createAdminClient()

    /* ── Solicitar feedback al cliente ─────────────────── */
    if (action === 'solicitar') {
      const { objetivo_id, persona_id, empresa_id, nombre_cliente, email_cliente } = body
      if (!objetivo_id || !persona_id || !nombre_cliente || !email_cliente) {
        return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
      }

      const token = generarToken()
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://trazaid.com'

      // Traer datos del objetivo y del empleado
      const [{ data: objetivo }, { data: persona }] = await Promise.all([
        admin.from('objetivos').select('titulo').eq('id', objetivo_id).maybeSingle(),
        admin.from('personas').select('nombre, apellido').eq('id', persona_id).maybeSingle(),
      ])

      await admin.from('feedback_cliente').insert({
        objetivo_id,
        empresa_id:     empresa_id ?? null,
        persona_id,
        nombre_cliente,
        email_cliente,
        token_acceso:   token,
      })

      const enlace = `${baseUrl}/feedback-cliente/${token}`
      const nombreEmpleado = persona ? `${persona.nombre} ${persona.apellido}` : 'tu colaborador'

      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'TRAZA <hola@trazaid.com>'
      let emailEnviado = false
      try {
        await resend.emails.send({
          from:     fromEmail,
          reply_to: fromEmail,
          to:       email_cliente,
          subject:  `${nombre_cliente ? `${nombre_cliente}, ` : ''}¿podés darle tu opinión a ${nombreEmpleado}?`,
          text:     `Hola${nombre_cliente ? ` ${nombre_cliente}` : ''},\n\n${nombreEmpleado} te pidió que dejes tu opinión sobre:\n"${objetivo?.titulo ?? 'un objetivo'}"\n\nSolo toma 1 minuto:\n${enlace}\n\nSi no lo conocés o no querés responder, ignorá este mensaje.\n\n${nombreEmpleado}`,
          html: `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#1a1a1a;font-size:15px;line-height:1.7;">
<p>Hola${nombre_cliente ? ` ${nombre_cliente}` : ''},</p>
<p>${nombreEmpleado} te pidió que dejes tu opinión sobre el trabajo que hizo en:</p>
<p style="margin:20px 0;padding:12px 16px;border-left:3px solid #ccc;color:#333;font-style:italic;">${objetivo?.titulo ?? 'un objetivo'}</p>
<p>Si tenés 1 minuto, podés responder acá:</p>
<p><a href="${enlace}" style="color:#1C2B90;">${enlace}</a></p>
<p>Si no lo conocés o no querés responder, ignorá este mensaje.</p>
<p style="margin-top:32px;color:#555;">${nombreEmpleado}</p>
<p style="margin-top:24px;font-size:12px;color:#999;">Este link expira en 30 días.</p>
</div>`,
        })
        emailEnviado = true
      } catch (emailErr: any) {
        console.error('feedback-cliente: error enviando email:', emailErr?.message ?? emailErr)
        return NextResponse.json({ ok: true, emailEnviado: false, emailError: emailErr?.message ?? 'Error desconocido' })
      }

      return NextResponse.json({ ok: true, emailEnviado })
    }

    /* ── Cliente responde feedback ───────────────────────── */
    if (action === 'responder') {
      const { token, puntuacion, comentario } = body
      if (!token || !puntuacion) {
        return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
      }

      const { data: fb } = await admin
        .from('feedback_cliente')
        .select('id, persona_id, objetivo_id, confirmado')
        .eq('token_acceso', token)
        .maybeSingle()

      if (!fb) return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
      if (fb.confirmado) return NextResponse.json({ error: 'Ya respondido' }, { status: 409 })

      await admin.from('feedback_cliente').update({
        confirmado:    true,
        puntuacion:    parseInt(puntuacion),
        comentario:    comentario?.trim() ?? null,
        respondido_en: new Date().toISOString(),
      }).eq('id', fb.id)

      // Notificar al empleado
      await admin.from('notificaciones').insert({
        empresa_id:  null,
        persona_id:  fb.persona_id,
        tipo:        'feedback_cliente_recibido',
        objetivo_id: fb.objetivo_id,
        mensaje:     `⭐ Un cliente dejó su opinión sobre uno de tus objetivos`,
      })

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (e: any) {
    console.error('feedback-cliente error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/feedback-cliente?objetivo_id=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const objetivo_id = searchParams.get('objetivo_id')
    const token       = searchParams.get('token')
    const admin = createAdminClient()

    if (token) {
      const { data } = await admin
        .from('feedback_cliente')
        .select('id, nombre_cliente, confirmado, objetivo_id, objetivo:objetivos(titulo)')
        .eq('token_acceso', token)
        .maybeSingle()
      return NextResponse.json({ feedback: data })
    }

    if (objetivo_id) {
      const { data } = await admin
        .from('feedback_cliente')
        .select('*')
        .eq('objetivo_id', objetivo_id)
        .order('created_at', { ascending: false })
      return NextResponse.json({ feedbacks: data ?? [] })
    }

    return NextResponse.json({ feedbacks: [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
