import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { nombre, apellido, cargo, area, score, moduloA, moduloB, moduloC, autonomo, cumplimiento, total, completados, positivos } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    const prompt = `Sos un sistema de análisis de desempeño profesional. Tu tarea es escribir UN párrafo corto (3-4 oraciones) en español, en tono profesional pero cercano, que explique el rendimiento de un empleado basándote en sus métricas.

Datos del empleado:
- Nombre: ${nombre} ${apellido}
- Cargo: ${cargo ?? 'No especificado'}
- Área: ${area ?? 'No especificada'}
- Índice TRAZA (score dual): ${score}/100
- Módulo A - Calidad de validaciones: ${moduloA}/100
- Módulo B - Cumplimiento de objetivos: ${moduloB}/100
- Módulo C - Consistencia autoevaluación: ${moduloC}/100
- Índice Autónomo (comportamiento observable): ${autonomo}/100
- Cumplimiento general: ${cumplimiento}%
- Total de objetivos: ${total}, Completados: ${completados}, Con validación positiva: ${positivos}

Instrucciones:
- Escribí en tercera persona (ej: "María demuestra...")
- Mencioná sus fortalezas concretas basadas en los módulos más altos
- Si hay una brecha grande entre Autónomo y el resto, mencionalo sutilmente
- Terminá con una frase orientada al futuro o al potencial
- NO uses bullet points ni listas, solo prosa fluida
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

    const data = await response.json()
    const narrativa = data.content?.[0]?.text ?? ''

    return NextResponse.json({ narrativa })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
