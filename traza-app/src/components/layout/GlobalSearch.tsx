'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Result {
  id: string
  titulo: string
  estado: string
}

const DOT: Record<string, string> = {
  en_progreso: '#3350D0',
  completado:  '#16A34A',
  vencido:     '#EF4444',
  pendiente:   '#94A3B8',
}

export default function GlobalSearch({ userId }: { userId: string }) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<Result[]>([])
  const [open,      setOpen]      = useState(false)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const ref    = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Obtener personaId una sola vez
  useEffect(() => {
    supabase.from('personas').select('id').eq('user_id', userId).maybeSingle()
      .then(({ data }) => data && setPersonaId(data.id))
  }, [userId])

  // Buscar con debounce
  useEffect(() => {
    if (!query.trim() || !personaId) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('objetivos')
        .select('id, titulo, estado')
        .eq('persona_id', personaId)
        .ilike('titulo', `%${query}%`)
        .limit(6)
      setResults(data ?? [])
      setOpen(true)
    }, 220)
    return () => clearTimeout(t)
  }, [query, personaId])

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(id: string) {
    setQuery('')
    setOpen(false)
    router.push(`/mi-trabajo?objetivo=${id}`)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         7,
        background:  'var(--surface)',
        border:      '1px solid var(--border)',
        borderRadius: 10,
        padding:     '0 11px',
        height:      34,
        width:       open || query ? 220 : 160,
        transition:  'width 0.2s ease',
      }}>
        <Search size={12.5} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar objetivos…"
          style={{
            flex:        1,
            border:      'none',
            outline:     'none',
            background:  'transparent',
            fontSize:    12,
            color:       'var(--ink-1)',
            fontFamily:  'inherit',
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div style={{
          position:     'absolute',
          top:          40,
          left:         0,
          minWidth:     240,
          background:   'white',
          border:       '1px solid var(--border)',
          borderRadius: 12,
          overflow:     'hidden',
          boxShadow:    '0 8px 24px rgba(15,23,42,0.12)',
          zIndex:       50,
        }}>
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => select(r.id)}
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         9,
                width:       '100%',
                padding:     '9px 14px',
                textAlign:   'left',
                border:      'none',
                background:  'transparent',
                cursor:      'pointer',
                borderBottom: i < results.length - 1 ? '1px solid #F8FAFC' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{
                width:        6,
                height:       6,
                borderRadius: '50%',
                flexShrink:   0,
                background:   DOT[r.estado] ?? '#94A3B8',
              }} />
              <span style={{ fontSize: 13, color: 'var(--ink-1)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.titulo}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
