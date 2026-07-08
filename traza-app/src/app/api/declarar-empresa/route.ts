import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generarToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join('')
}

// POST /api/declarar-empresa
// Body: { persona_id, empresa_nombre, empresa_dominio, supervisor_nombre, supervisor_email }
export async function POST(req: NextRequest) {
  try {
    const { persona_id, empresa_nombre, empresa_dominio, supervisor_nombre, supervisor_email } = await req.json()

    if (!persona_id || !empresa_nombre || !supervisor_email) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const admin = createAdminClient()
    const token = generarToken()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://traza-three.vercel.app'

    // Guardar datos en personas
    const { error } = await admin
      .from('personas')
      .update({
        empresa_actual_nombre:   empresa_nombre,
        empresa_actual_dominio:  empresa_dominio ?? null,
        supervisor_nombre:       supervisor_nombre ?? null,
        supervisor_email:        supervisor_email,
        supervisor_verificado:   false,
        supervisor_token:        token,
        supervisor_solicitado_en: new Date().toISOString(),
      })
      .eq('id', persona_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Traer datos del empleado para el email
    const { data: persona } = await admin
      .from('personas')
      .select('nombre, apellido, traza_id')
      .eq('id', persona_id)
      .maybeSingle()

    const nombreEmpleado = persona
      ? `${persona.nombre} ${persona.apellido}`
      : 'tu colaborador'

    // Enviar email al supervisor
    const enlaceVerificacion = `${baseUrl}/verificar-supervisor/${token}`

    await resend.emails.send({
      from:    'TRAZA <noreply@traza.app>',
      to:      supervisor_email,
      subject: `${nombreEmpleado} declaró que sos su supervisor en TRAZA`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#0F172A">
          <div style="background:#1C2B90;padding:24px 32px;border-radius:12px 12px 0 0">
            <span style="color:white;font-size:22px;font-weight:900;letter-spacing:-0.5px">traza</span>
          </div>
          <div style="background:#F8FAFC;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">Hola${supervisor_nombre ? `, ${supervisor_nombre}` : ''}.</h2>
            <p style="color:#475569;line-height:1.6;margin:0 0 16px">
              <strong>${nombreEmpleado}</strong> te declaró como su supervisor en <strong>TRAZA</strong>, la plataforma de historial profesional verificado.
            </p>
            <p style="color:#475569;line-height:1.6;margin:0 0 24px">
              Al confirmar, sus validaciones de desempeño en TRAZA tendrán mayor peso en su Índice Traza, y podrás seguir su progreso profesional.
            </p>
            <a href="${enlaceVerificacion}"
              style="display:inline-block;background:#3350D0;color:white;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:15px">
              Confirmar que soy su supervisor →
            </a>
            <p style="color:#94A3B8;font-size:12px;margin-top:24px">
              Si no conocés a esta persona o creés que esto fue un error, podés ignorar este mensaje.
              <br>Este link expira en 30 días.
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('declarar-empresa error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
