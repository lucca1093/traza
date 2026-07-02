import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { stats, ranking } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    const topPersonas = (ranking ?? []).slice(0, 3).map((r: any) =>
      `${r.persona?.nombre ?? ''} ${r.persona?.apellido ?? ''} (${r.indice?.score ?? 0}/100)`
    ).join(', ')

    const prompt = `Sos un analista de desempeño organizacional. Analizá los siguientes indicadores del equipo y escribí un resumen ejecutivo en español, en tono profesional pero directo, de 3 a 5 oraciones.

Indicadores del equipo:
- Score promedio del equipo: ${stats.indiceOrg}/100
- Total de colaboradores: ${stats.totalPersonas}
- Objetivos totales: ${stats.total} | Completados: ${stats.completados} | Cumplimiento: ${stats.cumplimiento}%
- Validaciones positivas (supervisor de acuerdo): ${stats.positivos}
- Validaciones negativas (supervisor en desacuerdo): ${stats.negativos}
- Objetivos completados sin validar: ${stats.sinValidar}
- Colaboradores en riesgo (score < 40): ${stats.enRiesgo}
- Discrepancias altas entre autoevaluación y validación: ${stats.discAlta}
- Discrepancias medias: ${stats.discMedia}
- Sin discrepancia (alineados): ${stats.discNula}
- Top 3 performers: ${topPersonas || 'No disponible'}

Instrucciones:
- Empezá con una frase que resuma el estado general del equipo
- Identificá el punto más fuerte y el más débil en base a los datos
- Si hay discrepancias altas, mencioná la importancia de alinear expectativas
- Si hay objetivos sin validar, señalalo como una acción pendiente
- Terminá con una recomendación concreta para el supervisor
- NO uses bullet points, solo prosa fluida
- Máximo 5 oraciones`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const data = await response.json()
    const analisis = data.content?.[0]?.text ?? ''

    return NextResponse.json({ analisis })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
