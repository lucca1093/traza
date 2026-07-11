import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const {
      nombre, cargo, area,
      score, moduloA, moduloB, moduloC, alineacion, evolucion,
      total, completados, positivos, racha,
      objetivosRecientes,
    } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    const obj_str = (objetivosRecientes ?? [])
      .slice(0, 5)
      .map((o: any) => `  - "${o.titulo}" (${o.estado}${o.validacion ? ', ' + o.validacion : ''})`)
      .join('\n')

    const prompt = `Sos un coach de carrera profesional. Tu tarea es generar exactamente 3 observaciones personalizadas y accionables sobre el desempeño y trayectoria de un profesional. Cada observación debe ser específica a sus datos reales, no genérica.

Datos del profesional:
- Nombre: ${nombre}
- Cargo: ${cargo ?? 'No especificado'}
- Área: ${area ?? 'No especificada'}
- Índice TRAZA: ${score}/100
- Resultados validados (Módulo A): ${moduloA}/100
- Cumplimiento (Módulo B): ${moduloB}/100
- Proactividad / constancia (Módulo C): ${moduloC}/100
- Alineación autoevaluación-supervisor (Módulo D): ${alineacion}/100
- Tendencia evolución (Módulo E): ${evolucion}/100
- Total objetivos: ${total} | Completados: ${completados} | Validados positivos: ${positivos}
- Racha actual de semanas activas: ${racha ?? 0}

Objetivos recientes:
${obj_str || '  (sin objetivos aún)'}

Instrucciones:
- Generá exactamente 3 observaciones. Cada una empieza con un emoji relevante.
- Cada observación: 1-2 oraciones directas, específicas, en segunda persona (vos/tu).
- Basate en los números: si moduloA es bajo, mencionalo. Si la racha es alta, reconocelo. Si hay brechas, señalalas.
- No repitas las mismas palabras entre observaciones.
- Respondé SOLO con las 3 observaciones en formato JSON: {"insights": ["observación 1", "observación 2", "observación 3"]}`

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
    const raw  = data.content?.[0]?.text ?? ''

    // Parsear JSON que devuelve el modelo
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ insights: [] })
    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({ insights: parsed.insights ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
