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

        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'TRAZA <noreply@traza.app>'
        await resend.emails.send({
          from: fromEmail,
          to: email.trim(),
          subject: `Confirmá tu evaluación sobre "${tituloObjetivo}"`,
          text: `Hola,\n\nRecibimos tu evaluación sobre "${tituloObjetivo}".\n\nPara que quede registrada y verificada, hacé clic en el siguiente link:\n${urlConfirmacion}\n\nEl link expira en 7 días. Si no realizaste esta evaluación, podés ignorar este mensaje.\n\n— TRAZA`,
          html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;max-width:560px;width:100%;">
      <!-- Header -->
      <tr><td style="background:#1C2B90;padding:24px 32px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:32px;height:32px;background:#ffffff;border-radius:7px;text-align:center;vertical-align:middle;">
            <span style="font-size:18px;font-weight:900;color:#1C2B90;line-height:32px;">Z</span>
          </td>
          <td style="padding-left:10px;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">traza</td>
        </tr></table>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 32px 28px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#3350D0;letter-spacing:0.08em;text-transform:uppercase;">Confirmación pendiente</p>
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0F172A;line-height:1.2;">Confirmá tu evaluación</h1>
        <p style="margin:0 0 12px;font-size:15px;color:#475569;line-height:1.6;">
          Recibimos tu evaluación sobre <strong style="color:#0F172A;">"${tituloObjetivo}"</strong>.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
          Para que quede registrada y cuente en el historial profesional de la persona, necesitamos confirmar que este email te pertenece.
        </p>
        <table cellpadding="0" cellspacing="0"><tr><td>
          <a href="${urlConfirmacion}" style="display:inline-block;background:#1C2B90;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:700;">
            Confirmar mi evaluación →
          </a>
        </td></tr></table>
        <p style="margin:28px 0 0;font-size:13px;color:#94A3B8;line-height:1.5;">
          O copiá este link en tu navegador:<br>
          <span style="color:#3350D0;word-break:break-all;">${urlConfirmacion}</span>
        </p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:20px 32px;border-top:1px solid #F1F5F9;">
        <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
          Si no realizaste esta evaluación, ignorá este mensaje. El link expira en 7 días.<br>
          <strong style="color:#64748B;">TRAZA</strong> · Performance Intelligence
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
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
