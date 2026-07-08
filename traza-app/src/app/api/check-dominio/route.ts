import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// GET /api/check-dominio?email=usuario@empresa.com
// Devuelve { empresa: { id, nombre } | null }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')?.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ empresa: null })
    }

    const dominio = email.split('@')[1]

    // Dominios genéricos que no identifican empresas
    const DOMINIOS_IGNORADOS = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
      'live.com', 'icloud.com', 'me.com', 'protonmail.com',
      'proton.me', 'tutanota.com', 'zoho.com', 'aol.com',
    ]
    if (DOMINIOS_IGNORADOS.includes(dominio)) {
      return NextResponse.json({ empresa: null })
    }

    const admin = createAdminClient()

    // Buscar empresa por dominio (campo dominio en tabla empresas)
    const { data: empresa } = await admin
      .from('empresas')
      .select('id, nombre, dominio')
      .eq('dominio', dominio)
      .maybeSingle()

    if (empresa) {
      return NextResponse.json({ empresa: { id: empresa.id, nombre: empresa.nombre } })
    }

    // Si no hay campo dominio, buscar por coincidencia en el nombre (heurística)
    // Ej: dominio "acme.com" → buscar empresa "Acme" o "ACME"
    const nombreBase = dominio.split('.')[0]
    const { data: empresaPorNombre } = await admin
      .from('empresas')
      .select('id, nombre')
      .ilike('nombre', `%${nombreBase}%`)
      .limit(1)
      .maybeSingle()

    if (empresaPorNombre) {
      return NextResponse.json({ empresa: { id: empresaPorNombre.id, nombre: empresaPorNombre.nombre } })
    }

    return NextResponse.json({ empresa: null })
  } catch (e: any) {
    return NextResponse.json({ empresa: null })
  }
}
