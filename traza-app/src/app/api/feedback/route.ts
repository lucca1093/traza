import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, ...data } = body
    const admin = createAdminClient()

    /* ── Sugerencia con IA ─────────────────────────────── */
    if (action === 'sugerir') {
      const { persona_nombre, dim_ejecucion, dim_comunicacion,
              dim_colaboracion, dim_iniciativa, dim_liderazgo, periodo } = data

      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })

      const dims = [
        `Ejecución de tareas: ${dim_ejecucion}/5`,
        `Comunicación: ${dim_comunicacion}/5`,
        `Colaboración: ${dim_colaboracion}/5`,
        `Iniciativa: ${dim_iniciativa}/5`,
        `Liderazgo: ${dim_liderazgo}/5`,
      ].join(', ')

      const prompt = `Sos un supervisor dando feedback formal a un colaborador llamado ${persona_nombre} en el período ${periodo}.

Las dimensiones evaluadas (escala 1 a 5) son: ${dims}.

Redactá un párrafo de feedback constructivo, profesional y específico en español. El texto debe:
- Reconocer los puntos fuertes (dimensiones con puntaje 4-5) sin exagerar
- Señalar con tacto las oportunidades de mejora en las dimensiones con puntaje 1-3
- Ser directo pero empático, en primera persona del supervisor
- No usar bullet points ni encabezados, solo prosa fluida
- Máximo 4 oraciones`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        return NextResponse.json({ error: err }, { status: response.status })
      }

      const aiData = await response.json()
      const sugerencia = aiData.content?.[0]?.text ?? ''
      return NextResponse.json({ sugerencia })
    }

    /* ── Guardar feedback ──────────────────────────────── */
    if (action === 'guardar') {
      const {
        persona_id, empresa_id, supervisor_id, periodo,
        dim_ejecucion, dim_comunicacion, dim_colaboracion,
        dim_iniciativa, dim_liderazgo, comentario_general, borrador,
      } = data

      const { data: existing } = await admin
        .from('feedback_formal')
        .select('id')
        .eq('persona_id', persona_id)
        .eq('supervisor_id', supervisor_id)
        .eq('periodo', periodo)
        .maybeSingle()

      const payload = {
        dim_ejecucion, dim_comunicacion, dim_colaboracion,
        dim_iniciativa, dim_liderazgo, comentario_general,
        borrador,
        enviado_en: borrador ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        await admin.from('feedback_formal').update(payload).eq('id', existing.id)
      } else {
        await admin.from('feedback_formal').insert({
          persona_id, empresa_id, supervisor_id, periodo, ...payload,
        })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const persona_id = searchParams.get('persona_id')
    if (!persona_id) return NextResponse.json({ feedback: [] })

    const admin = createAdminClient()
    const { data } = await admin
      .from('feedback_formal')
      .select('*')
      .eq('persona_id', persona_id)
      .eq('borrador', false)
      .order('created_at', { ascending: false })

    return NextResponse.json({ feedback: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
