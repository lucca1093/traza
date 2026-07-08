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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://traza-three.vercel.app'

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

      await resend.emails.send({
        from:    'TRAZA <noreply@traza.app>',
        to:      email_cliente,
        subject: `${nombreEmpleado} te pide feedback sobre un objetivo`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#0F172A">
            <div style="background:#1C2B90;padding:24px 32px;border-radius:12px 12px 0 0">
              <span style="color:white;font-size:22px;font-weight:900;letter-spacing:-0.5px">traza</span>
            </div>
            <div style="background:#F8FAFC;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">Hola${nombre_cliente ? `, ${nombre_cliente}` : ''}.</h2>
              <p style="color:#475569;line-height:1.6;margin:0 0 16px">
                <strong>${nombreEmpleado}</strong> te solicita tu opinión sobre el siguiente objetivo:
              </p>
              <div style="background:white;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:0 0 24px">
                <p style="margin:0;font-weight:600;color:#0F172A">${objetivo?.titulo ?? 'Objetivo'}</p>
              </div>
              <a href="${enlace}"
                style="display:inline-block;background:#3350D0;color:white;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:15px">
                Dar mi opinión →
              </a>
              <p style="color:#94A3B8;font-size:12px;margin-top:24px">
                Solo toma 1 minuto. Tu feedback ayuda a construir un historial profesional verificado.
                <br>Este link es personal y expira en 30 días.
              </p>
            </div>
          </div>
        `,
      })

      return NextResponse.json({ ok: true })
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
