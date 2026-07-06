import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

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

        await resend.emails.send({
          from: 'Traza <noreply@traza.app>',
          to: email.trim(),
          subject: 'Confirmá tu validación en Traza',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1a1a2e;">
              <div style="margin-bottom: 32px;">
                <span style="font-size: 22px; font-weight: 700; color: #1C2B90;">Z traza</span>
              </div>

              <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px;">Confirmá tu validación</h2>
              <p style="color: #4b5563; margin: 0 0 8px;">
                Recibimos tu validación sobre <strong>${tituloObjetivo}</strong>.
              </p>
              <p style="color: #4b5563; margin: 0 0 32px;">
                Para que sea verificada y cuente en el registro profesional de la persona, necesitamos confirmar que este email te pertenece.
              </p>

              <a href="${urlConfirmacion}"
                style="display: inline-block; background: #1C2B90; color: #ffffff; text-decoration: none;
                       padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Confirmar mi validación
              </a>

              <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">
                Si no realizaste esta validación podés ignorar este email. El link expira en 7 días.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                Traza · Performance Intelligence
              </p>
            </div>
          `,
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
