import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad · TRAZA',
  description: 'Cómo TRAZA recopila, usa y protege tu información personal.',
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

export default function PoliticaPrivacidadPage() {
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
            Política de Privacidad
          </h1>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Última actualización: {LAST_UPDATED}</p>
        </div>

        <div
          className="bg-white rounded-2xl px-8 py-8"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}
        >

          <Section title="1. Quiénes somos">
            <p>
              TRAZA es una plataforma de gestión de desempeño profesional. Operamos el sitio web{' '}
              <strong>traza.app</strong> y la aplicación web asociada. En esta política, cuando decimos
              "TRAZA", "nosotros" o "nuestro", nos referimos al equipo responsable de esta plataforma.
            </p>
            <p>
              Nos comprometemos a proteger tu privacidad y a tratar tus datos personales de acuerdo con
              la legislación argentina vigente, en particular la Ley N° 25.326 de Protección de Datos
              Personales y sus normas reglamentarias.
            </p>
          </Section>

          <Section title="2. Qué información recopilamos">
            <p><strong style={{ color: '#0F172A' }}>Información que vos nos proporcionás:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre, apellido y dirección de correo electrónico al registrarte.</li>
              <li>Información laboral: empresa, cargo, área y supervisor.</li>
              <li>Objetivos profesionales, avances, autoevaluaciones y resultados.</li>
              <li>Comunicaciones con validadores externos y supervisores.</li>
            </ul>
            <p className="mt-3"><strong style={{ color: '#0F172A' }}>Información recopilada automáticamente:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Datos de uso de la aplicación (páginas visitadas, acciones realizadas).</li>
              <li>Dirección IP, tipo de navegador y sistema operativo.</li>
              <li>Fechas y horarios de acceso.</li>
            </ul>
          </Section>

          <Section title="3. Para qué usamos tu información">
            <p>Utilizamos los datos recopilados para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Proveer y mantener la plataforma TRAZA.</li>
              <li>Calcular tu Índice TRAZA y mostrarte tu historial de desempeño.</li>
              <li>Permitir que supervisores y managers validen tus objetivos.</li>
              <li>Enviarte notificaciones relacionadas con tu cuenta y tus objetivos.</li>
              <li>Mejorar la experiencia de uso de la plataforma.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
            <p>
              <strong style={{ color: '#0F172A' }}>No vendemos tus datos personales</strong> a terceros
              ni los utilizamos para publicidad de terceros.
            </p>
          </Section>

          <Section title="4. Tus datos son tuyos">
            <p>
              TRAZA se basa en el principio de que tu historial profesional te pertenece a vos, no a tu
              empleador. Esto significa:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Podés exportar tus datos en cualquier momento desde la sección de Reportes.</li>
              <li>Podés desactivar el acceso público a tu credencial en cualquier momento.</li>
              <li>Si dejás una empresa, tu historial permanece en tu cuenta personal.</li>
              <li>Podés solicitar la eliminación de tu cuenta y todos tus datos.</li>
            </ul>
          </Section>

          <Section title="5. Compartición de datos">
            <p>Compartimos tus datos únicamente en los siguientes casos:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong style={{ color: '#0F172A' }}>Con tu empresa:</strong> supervisores y
                administradores de tu empresa pueden ver tus objetivos y desempeño dentro de la
                plataforma.
              </li>
              <li>
                <strong style={{ color: '#0F172A' }}>Con validadores externos:</strong> cuando solicitás
                una validación externa, compartimos información limitada con la persona que designás.
              </li>
              <li>
                <strong style={{ color: '#0F172A' }}>Con proveedores de servicio:</strong> utilizamos
                Supabase para almacenamiento de datos y Resend para envío de emails. Estos proveedores
                actúan como procesadores de datos bajo nuestras instrucciones.
              </li>
              <li>
                <strong style={{ color: '#0F172A' }}>Por obligación legal:</strong> cuando lo exija la
                ley o una orden judicial.
              </li>
            </ul>
          </Section>

          <Section title="6. Credencial pública">
            <p>
              Si habilitás tu credencial pública, ciertas informaciones de tu perfil (nombre, Índice
              Traza, objetivos completados y validaciones) serán accesibles mediante un enlace único.
              Podés activar o desactivar esta función en cualquier momento desde tu perfil.
            </p>
          </Section>

          <Section title="7. Seguridad">
            <p>
              Implementamos medidas técnicas y organizativas para proteger tu información, incluyendo
              encriptación de datos en tránsito (HTTPS) y en reposo, control de acceso basado en roles,
              y autenticación segura mediante Supabase Auth.
            </p>
            <p>
              Sin embargo, ningún sistema es 100% seguro. Te recomendamos usar una contraseña única
              y segura para tu cuenta de TRAZA.
            </p>
          </Section>

          <Section title="8. Retención de datos">
            <p>
              Conservamos tu información mientras tu cuenta esté activa. Si solicitás la eliminación de
              tu cuenta, eliminaremos o anonimizaremos tus datos personales dentro de los 30 días
              hábiles siguientes, salvo que debamos conservarlos por obligaciones legales.
            </p>
          </Section>

          <Section title="9. Tus derechos">
            <p>
              De acuerdo con la Ley N° 25.326, tenés derecho a acceder, rectificar, actualizar y
              suprimir tus datos personales. Para ejercer estos derechos, podés:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Modificar tu información directamente desde tu perfil en la plataforma.</li>
              <li>Contactarnos por email a <strong style={{ color: '#0F172A' }}>privacidad@traza.app</strong>.</li>
            </ul>
            <p>
              La Dirección Nacional de Protección de Datos Personales (DNPDP) es el órgano de control
              competente en Argentina para cuestiones relativas a la protección de datos personales.
            </p>
          </Section>

          <Section title="10. Cookies">
            <p>
              Utilizamos cookies de sesión estrictamente necesarias para el funcionamiento de la
              plataforma (autenticación). No utilizamos cookies de seguimiento ni publicidad de terceros.
            </p>
          </Section>

          <Section title="11. Cambios a esta política">
            <p>
              Podemos actualizar esta política ocasionalmente. Te notificaremos por email ante cambios
              significativos. La fecha de última actualización siempre figurará al inicio del documento.
            </p>
          </Section>

          <Section title="12. Contacto">
            <p>
              Si tenés preguntas sobre esta política o sobre el tratamiento de tus datos, escribinos a{' '}
              <strong style={{ color: '#0F172A' }}>privacidad@traza.app</strong>.
            </p>
          </Section>

        </div>

        <div className="mt-8 flex flex-wrap gap-4 items-center justify-center text-sm" style={{ color: '#94A3B8' }}>
          <Link href="/terminos-y-condiciones" style={{ color: '#3350D0' }}>Términos y Condiciones</Link>
          <span>·</span>
          <Link href="/" style={{ color: '#3350D0' }}>Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
