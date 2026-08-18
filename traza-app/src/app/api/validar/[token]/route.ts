import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { checkRateLimit, getIP } from '@/lib/rate-limit'

const DOMINIOS_PERSONALES = new Set([
  'gmail.com','hotmail.com','yahoo.com','outlook.com','live.com','icloud.com',
  'protonmail.com','yahoo.com.ar','hotmail.com.ar','gmail.com.ar','outlook.com.ar',
  'msn.com','me.com','mail.com','inbox.com','aol.com',
])

function getNivelConfianza(email: string | null): 'corporativo' | 'personal' | 'sin_email' {
  if (!email?.trim()) return 'sin_email'
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (!domain) return 'sin_email'
  return DOMINIOS_PERSONALES.has(domain) ? 'personal' : 'corporativo'
}

function getDominioPublico(email: string | null): string | null {
  if (!email?.trim()) return null
  return email.split('@')[1]?.toLowerCase() ?? null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Máx 5 validaciones por IP por hora
  if (!checkRateLimit(getIP(request), 'validar', 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intentá de nuevo en un rato.' }, { status: 429 })
  }

  try {
    const admin = createAdminClient()
    const { token } = params

    // Buscar el token
    const { data: tokenData } = await admin
      .from('tokens_validacion')
      .select('*, objetivo:objetivos(id, titulo, persona_id)')
      .eq('token', token)
      .single()

    if (!tokenData) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
    }

    if (tokenData.usado) {
      return NextResponse.json({ error: 'Este link ya fue utilizado' }, { status: 410 })
    }

    if (new Date(tokenData.expira_en) < new Date()) {
      return NextResponse.json({ error: 'Este link expiró' }, { status: 410 })
    }

    // Leer los datos del formulario
    const body = await request.json()
    const { nombre, email, cargo, empresa, calificacion, comentario } = body

    if (!nombre?.trim() || !calificacion) {
      return NextResponse.json({ error: 'Nombre y calificación son requeridos' }, { status: 400 })
    }

    if (!email?.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 })
    }

    const calificacionesValidas = ['De acuerdo', 'Parcialmente de acuerdo', 'En desacuerdo']
    if (!calificacionesValidas.includes(calificacion)) {
      return NextResponse.json({ error: 'Calificación inválida' }, { status: 400 })
    }

    const nivelConfianza      = getNivelConfianza(email)
    const dominioPublico      = getDominioPublico(email)
    const tokenConfirmacion   = crypto.randomUUID()

    // Guardar la validación externa (sin confirmar por defecto)
    const { error: insertError } = await admin
      .from('validaciones_externas')
      .insert({
        token_id:             tokenData.id,
        objetivo_id:          tokenData.objetivo_id,
        nombre:               nombre.trim(),
        email:                email.trim(),
        cargo:                cargo?.trim() ?? null,
        empresa:              empresa?.trim() ?? null,
        calificacion,
        comentario:           comentario?.trim() ?? null,
        nivel_confianza:      nivelConfianza,
        dominio_publico:      dominioPublico,
        confirmado:           false,
        token_confirmacion:   tokenConfirmacion,
      })

    if (insertError) {
      console.error('Error insertando validación:', insertError)
      return NextResponse.json({ error: 'Error guardando validación' }, { status: 500 })
    }

    // Marcar token como usado
    await admin
      .from('tokens_validacion')
      .update({ usado: true, usado_en: new Date().toISOString() })
      .eq('id', tokenData.id)

    // Enviar email de confirmación (solo si hay API key configurada)
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://traza-three.vercel.app'
        const urlConfirmacion = `${baseUrl}/api/confirmar-validacion/${tokenConfirmacion}`
        const tituloObjetivo = (tokenData.objetivo as any)?.titulo ?? 'un objetivo'

        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'TRAZA <lucca@trazaid.com>'
        await resend.emails.send({
          from:     fromEmail,
          reply_to: fromEmail,
          to:       email.trim(),
          subject:  `Confirmá tu evaluación (un clic)`,
          text:     `Hola,\n\nGracias por completar la evaluación sobre "${tituloObjetivo}".\n\nPara que quede registrada, hacé clic en este link:\n${urlConfirmacion}\n\nExpira en 7 días. Si no completaste ninguna evaluación, ignorá este mensaje.\n\nTRAZA`,
          html:     `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;color:#1a1a1a;font-size:15px;line-height:1.7;">
<p>Hola,</p>
<p>Gracias por completar la evaluación sobre <em>${tituloObjetivo}</em>.</p>
<p>Para que quede registrada solo falta un paso: confirmá tu email haciendo clic acá:</p>
<p><a href="${urlConfirmacion}" style="color:#1C2B90;">${urlConfirmacion}</a></p>
<p>El link expira en 7 días.</p>
<p style="margin-top:32px;color:#555;">TRAZA</p>
<p style="margin-top:8px;font-size:12px;color:#999;">Si no completaste ninguna evaluación, ignorá este mensaje.</p>
</div>`,
        })
      } catch (emailErr) {
        // El email falló pero la validación ya se guardó — no romper el flujo
        console.error('Error enviando email de confirmación:', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en /api/validar:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
