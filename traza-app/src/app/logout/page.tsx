'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.signOut().then(() => {
      router.push('/login')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
        <span className="text-sm">Cerrando sesión...</span>
      </div>
    </div>
  )
}
