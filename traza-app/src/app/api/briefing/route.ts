import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { equipo, fecha } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })

    const lineas = (equipo as any[]).map((m) => {
      const actividad = m.diasSinActividad !== null
        ? `${m.diasSinActividad}d sin actividad`
        : 'sin avances registrados'
      return `- ${m.nombre} ${m.apellido}: score ${m.score}/100 | ${m.vencidos} obj vencidos | ${actividad} | cierre semanal: ${m.cierreSemanal ? 'sí' : 'no'}`
    }).join('\n')

    const prompt = `Sos un asistente de management. Analizá el estado del equipo al ${fecha} y generá un briefing semanal en español, profesional y directo.

Estado del equipo:
${lineas}

Generá el briefing con estas 4 secciones usando exactamente estos encabezados en negrita:

**Resumen general**
Estado global en 1-2 oraciones.

**En riesgo**
Personas que necesitan atención inmediata (score bajo, muchos días sin actividad, objetivos vencidos). Usá sus nombres reales.

**Destacados**
Personas con buen desempeño esta semana. Usá sus nombres reales.

**Acciones sugeridas**
2-3 acciones concretas que el supervisor debería tomar esta semana.

Sé específico y directo. No uses frases genéricas si tenés datos concretos.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const aiData = await response.json()
    const briefing = aiData.content?.[0]?.text ?? ''
    return NextResponse.json({ briefing })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
