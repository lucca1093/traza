import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle, FileText, ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'Soporte · TRAZA' }

const DISPLAY = "'Plus Jakarta Sans', system-ui, sans-serif"

function Card({ icon, title, desc, action, href }: {
  icon: React.ReactNode; title: string; desc: string; action: string; href: string
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="block bg-white rounded-2xl p-6 transition-shadow hover:shadow-md"
      style={{ border: '1px solid #E2E8F0' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: '#EDEFFD' }}
      >
        <span style={{ color: '#3350D0' }}>{icon}</span>
      </div>
      <h2
        className="text-base font-semibold mb-1"
        style={{ color: '#0F172A', fontFamily: DISPLAY }}
      >
        {title}
      </h2>
      <p className="text-sm mb-4" style={{ color: '#64748B', lineHeight: 1.6 }}>{desc}</p>
      <span className="text-sm font-semibold" style={{ color: '#3350D0' }}>
        {action} →
      </span>
    </a>
  )
}

export default function SoportePage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div className="traza-page-header">
        <div>
          <h1 className="traza-page-title">Soporte</h1>
          <p className="traza-page-sub">Estamos para ayudarte</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          icon={<Mail size={18} />}
          title="Escribinos por email"
          desc="Para consultas generales, problemas técnicos o preguntas sobre tu cuenta."
          action="soporte@traza.app"
          href="mailto:soporte@traza.app"
        />
        <Card
          icon={<FileText size={18} />}
          title="Política de Privacidad"
          desc="Cómo recopilamos, usamos y protegemos tu información personal."
          action="Ver documento"
          href="/politica-de-privacidad"
        />
        <Card
          icon={<FileText size={18} />}
          title="Términos y Condiciones"
          desc="Las condiciones bajo las cuales podés usar la plataforma TRAZA."
          action="Ver documento"
          href="/terminos-y-condiciones"
        />
        <Card
          icon={<MessageCircle size={18} />}
          title="Consultas comerciales"
          desc="Para planes enterprise, precios personalizados o demos para tu empresa."
          action="hola@traza.app"
          href="mailto:hola@traza.app"
        />
      </div>

      <div
        className="rounded-2xl px-6 py-5"
        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: '#0F172A' }}>
          Tiempo de respuesta
        </p>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Respondemos todos los emails dentro de las <strong>48 horas hábiles</strong>.
          Para urgencias, mencionalo en el asunto del mail.
        </p>
      </div>
    </div>
  )
}
