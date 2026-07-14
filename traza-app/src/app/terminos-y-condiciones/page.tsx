import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones · TRAZA',
  description: 'Condiciones de uso de la plataforma TRAZA.',
}

const LAST_UPDATED = '1 de julio de 2025'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-lg font-bold mb-3"
        style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: '#475569' }}>
        {children}
      </div>
    </section>
  )
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#1C2B90" />
              <rect x="10" y="11.5" width="20" height="3" rx="1.5" fill="white" />
              <path d="M 28 14.5 L 12 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="10" y="25.5" width="20" height="3" rx="1.5" fill="white" />
            </svg>
            <span style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>
              TRAZA
            </span>
          </Link>
          <Link href="/" className="text-sm" style={{ color: '#64748B' }}>← Volver al inicio</Link>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", letterSpacing: '-0.03em' }}
          >
            Términos y Condiciones
          </h1>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Última actualización: {LAST_UPDATED}</p>
        </div>

        <div
          className="bg-white rounded-2xl px-8 py-8"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}
        >

          <Section title="1. Aceptación de los términos">
            <p>
              Al registrarte y utilizar la plataforma TRAZA (el "Servicio"), aceptás estos Términos y
              Condiciones en su totalidad. Si no estás de acuerdo con alguna de las condiciones aquí
              establecidas, no debés utilizar el Servicio.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              TRAZA es una plataforma de gestión y registro de desempeño profesional que permite a
              usuarios individuales y organizaciones:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Registrar objetivos profesionales y hacer seguimiento de su cumplimiento.</li>
              <li>Solicitar y recibir validaciones de supervisores y terceros.</li>
              <li>Calcular un Índice Traza que refleja el desempeño verificado.</li>
              <li>Generar y compartir una credencial profesional portátil.</li>
            </ul>
          </Section>

          <Section title="3. Registro y cuenta">
            <p>
              Para utilizar TRAZA debés crear una cuenta con información veraz y actualizada. Sos
              responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las
              actividades que ocurran bajo tu cuenta.
            </p>
            <p>
              TRAZA se reserva el derecho de suspender o cancelar cuentas que violen estos términos o
              sean utilizadas de forma fraudulenta.
            </p>
          </Section>

          <Section title="4. Propiedad de los datos">
            <p>
              <strong style={{ color: '#0F172A' }}>Tus datos de desempeño te pertenecen a vos.</strong>{' '}
              TRAZA actúa como custodio de tu información, pero no adquiere derechos de propiedad sobre
              tu historial profesional, objetivos ni resultados.
            </p>
            <p>
              Al usar el Servicio, nos otorgás una licencia limitada, no exclusiva y revocable para
              procesar y mostrar tu información dentro de la plataforma con el propósito de proveer el
              Servicio.
            </p>
          </Section>

          <Section title="5. Uso aceptable">
            <p>Al utilizar TRAZA te comprometés a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Proporcionar información veraz en objetivos, avances y autoevaluaciones.</li>
              <li>No suplantar la identidad de otras personas.</li>
              <li>No utilizar el Servicio para actividades ilegales o fraudulentas.</li>
              <li>No intentar acceder a datos de otros usuarios sin autorización.</li>
              <li>No interferir con el funcionamiento técnico de la plataforma.</li>
            </ul>
            <p>
              El uso del Servicio para registrar información falsa con el propósito de obtener
              validaciones fraudulentas constituye una violación grave de estos términos y puede dar
              lugar a la suspensión inmediata de la cuenta.
            </p>
          </Section>

          <Section title="6. Responsabilidades de las empresas">
            <p>
              Si utilizás TRAZA como administrador o supervisor de una organización, sos responsable de:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Informar a los colaboradores sobre el uso de la plataforma y el tratamiento de sus datos.</li>
              <li>Obtener los consentimientos necesarios para el procesamiento de datos de empleados.</li>
              <li>Garantizar que las validaciones reflejen una evaluación honesta del desempeño.</li>
            </ul>
          </Section>

          <Section title="7. Credencial pública">
            <p>
              La credencial pública de TRAZA es generada a partir de datos verificados dentro de la
              plataforma. TRAZA no garantiza que la información en la credencial sea utilizada o
              interpretada de una manera específica por terceros (empleadores, clientes, etc.).
            </p>
            <p>
              El usuario es el único responsable de decidir cuándo y con quién compartir su credencial.
            </p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>
              TRAZA provee el Servicio "tal como está". No garantizamos disponibilidad ininterrumpida
              ni que el Servicio esté libre de errores. En la máxima medida permitida por la ley, TRAZA
              no será responsable por daños indirectos, incidentales o consecuentes derivados del uso
              o la imposibilidad de uso del Servicio.
            </p>
          </Section>

          <Section title="9. Modificaciones al servicio y a los términos">
            <p>
              TRAZA puede modificar, suspender o discontinuar el Servicio en cualquier momento,
              notificando a los usuarios con razonable anticipación. También podemos actualizar estos
              Términos; los cambios sustanciales serán comunicados por email.
            </p>
          </Section>

          <Section title="10. Cancelación y eliminación de cuenta">
            <p>
              Podés cancelar tu cuenta en cualquier momento contactándonos. Tras la cancelación,
              eliminaremos tus datos personales en un plazo de 30 días hábiles, salvo obligación legal
              de conservarlos.
            </p>
          </Section>

          <Section title="11. Legislación aplicable">
            <p>
              Estos Términos se rigen por las leyes de la República Argentina. Cualquier controversia
              derivada del uso del Servicio será sometida a la jurisdicción de los tribunales ordinarios
              de la Ciudad Autónoma de Buenos Aires.
            </p>
          </Section>

          <Section title="12. Contacto">
            <p>
              Para consultas sobre estos Términos, escribinos a{' '}
              <strong style={{ color: '#0F172A' }}>legal@traza.app</strong>.
            </p>
          </Section>

        </div>

        <div className="mt-8 flex flex-wrap gap-4 items-center justify-center text-sm" style={{ color: '#94A3B8' }}>
          <Link href="/politica-de-privacidad" style={{ color: '#3350D0' }}>Política de Privacidad</Link>
          <span>·</span>
          <Link href="/" style={{ color: '#3350D0' }}>Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
