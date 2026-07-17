# TRAZA — Pendientes de lanzamiento
> Auditoría técnica y de producto · Julio 2026
> Estado: en desarrollo activo. Lo que sigue es lo que falta antes de la primera venta real.

---

## 🔴 IMPRESCINDIBLES — Sin esto no lanzar

---

### 1. Integración de billing (Stripe o MercadoPago)

**Qué es:** Un sistema de cobro que permita a clientes suscribirse y pagar de forma autónoma, sin intervención manual.

**Por qué es bloqueante:** Sin billing no hay negocio. Actualmente no existe ninguna forma de que una empresa pague por TRAZA. Si alguien quiere contratar, no puede hacerlo solo — requeriría una transferencia manual, una factura por fuera, o una llamada. Eso no escala y no da confianza.

**Qué habría que implementar:**
- Integrar Stripe (recomendado para internacionalización) o MercadoPago (si el foco es LATAM).
- Crear al menos 1 plan pagable (por ejemplo: Plan Empresa — hasta 10 usuarios — $X/mes).
- Página de pricing con botón que lleve al flujo de pago.
- Webhook de Stripe que active/desactive el acceso según el estado de la suscripción en Supabase.
- Portal de cliente para que el admin pueda ver y cancelar su suscripción.

**Esfuerzo estimado:** 1 semana de desarrollo.

---

### 2. Recuperación de contraseña

**Qué es:** El flujo estándar de "Olvidé mi contraseña" que envía un email con link para resetear.

**Por qué es bloqueante:** Si un usuario pierde acceso a su cuenta, actualmente no puede recuperarla sin intervención manual del equipo de TRAZA. En un producto SaaS esto es inaceptable — es una de las primeras cosas que los usuarios prueban al registrarse.

**Qué habría que implementar:**
- Página `/recuperar-contraseña` con campo de email.
- Llamada a `supabase.auth.resetPasswordForEmail()`.
- Página `/nueva-contraseña` que recibe el token del email y permite setear la nueva contraseña con `supabase.auth.updateUser()`.
- Email de recuperación configurado en el template de Supabase con el dominio correcto.

**Esfuerzo estimado:** 2–3 días de desarrollo.

---

### 3. Dominio definitivo registrado y configurado

**Qué es:** El dominio propio (por ejemplo traza.app o usamostraza.com) apuntando a la app en producción, con SSL, sin el subdominio de Vercel.

**Por qué es bloqueante:** Mandar a un cliente enterprise a `traza-app.vercel.app` elimina toda credibilidad. El dominio es la primera señal de seriedad de cualquier producto.

**Qué habría que implementar:**
- Registrar el dominio elegido (si no está hecho).
- Configurarlo en Vercel como custom domain.
- Configurar registros DNS: A record o CNAME apuntando a Vercel.
- Verificar SSL automático (Vercel lo gestiona solo).
- Actualizar las referencias a `traza.app/p/[trazaId]` que ya aparecen en el informe PDF.

**Esfuerzo estimado:** 1 día (técnico). El tiempo real depende de la propagación DNS (hasta 48 horas).

---

### 4. Email transaccional funcionando (Resend con dominio verificado)

**Qué es:** El sistema de emails que TRAZA envía automáticamente — confirmaciones de validación externa, notificaciones, emails de bienvenida.

**Por qué es bloqueante:** Actualmente el código está integrado con Resend, pero sin un dominio verificado los emails o no salen, o van directo a spam. El flujo de validación externa (que es uno de los más diferenciadores del producto) depende completamente de que el email llegue al validador externo.

**Qué habría que implementar:**
- Registrar el dominio en Resend y verificarlo (agregar registros DNS: SPF, DKIM, DMARC).
- Cambiar el from de `noreply@traza.app` al dominio verificado real.
- Probar el flujo completo de validación externa con un email externo real.
- Configurar templates de email para: bienvenida al registrarse, solicitud de validación externa, confirmación de validación completada, recuperación de contraseña.

**Esfuerzo estimado:** 1–2 días de configuración + testing.

---

### 5 y 6. Política de Privacidad + Términos y Condiciones

**Qué es:** Los documentos legales básicos de cualquier producto digital que maneja datos personales.

**Por qué es bloqueante:** TRAZA maneja datos laborales sensibles: objetivos de desempeño, validaciones de supervisores, historial profesional. Sin Política de Privacidad hay riesgo legal activo en Argentina, México, Colombia y la mayoría de los países de LATAM que tienen regulaciones de protección de datos (la argentina es la Ley 25.326). Además, sin T&C, no hay contrato entre TRAZA y el cliente — cualquier disputa queda sin marco legal.

**Qué habría que implementar:**
- Redactar o contratar la redacción de ambos documentos (pueden ser los mínimos viables pero deben existir).
- Publicarlos en `/privacidad` y `/terminos`.
- Agregar el link en el footer de la landing, en el registro, y en el informe PDF.
- Agregar checkbox de aceptación en el flujo de registro ("Acepto los Términos y la Política de Privacidad").

**Esfuerzo estimado:** 1–2 días para redacción básica (puede hacerse con ayuda de IA + revisión de abogado). Implementación: medio día.

---

### 7. Favicon e ícono de app

**Qué es:** El ícono que aparece en la pestaña del navegador, en bookmarks, y al instalar como PWA.

**Por qué es bloqueante (nivel imagen):** Actualmente TRAZA usa el favicon default de Next.js (el triángulo de Vercel). Es el equivalente a que una empresa mande un email sin logo. Es un detalle pequeño pero que comunica "esto es un prototipo, no un producto".

**Qué habría que implementar:**
- Diseñar el ícono en SVG (el ícono del Z/marca ya existe en el Sidebar, hay que exportarlo).
- Generar los tamaños: 16x16, 32x32, 180x180 (Apple touch icon), 192x192 y 512x512 (PWA).
- Reemplazar el `/app/favicon.ico` actual.
- Agregar las referencias en el layout: `apple-touch-icon`, `manifest` icons.

**Esfuerzo estimado:** Medio día.

---

### 8. Sidebar mobile responsivo

**Qué es:** En mobile (pantallas menores a 768px), el sidebar fijo de 256px ocupa o corta el contenido principal.

**Por qué es bloqueante:** Una porción significativa de los usuarios (y todos los empleados que registran avances en el momento) van a acceder desde el celular. Si el layout está roto en mobile, el producto no es usable.

**Qué habría que implementar:**
- El sidebar ya tiene lógica de `isOpen` / `onClose` preparada — falta conectarla al layout principal.
- Agregar un botón hamburguesa en la barra superior para abrir/cerrar en mobile.
- Asegurarse de que el contenido principal use `pl-0 lg:pl-64` para no quedar debajo del sidebar.
- Revisar que las tablas de Reportes y Validación sean horizontalmente scrolleables en mobile (`overflow-x-auto`).
- Opcional: agregar una barra de navegación inferior (bottom nav) con los 4–5 ítems más usados para una experiencia mobile nativa.

**Esfuerzo estimado:** 2–3 días.

---

### 9. Estado vacío en Dashboard con guía para usuario nuevo

**Qué es:** Cuando un usuario recién registrado entra al Dashboard sin datos, hoy ve una pantalla casi en blanco. No sabe qué hacer ni por dónde empezar.

**Por qué es bloqueante:** La primera experiencia determina si el usuario vuelve o abandona. Un usuario que llega al Dashboard y ve "no tenés objetivos" sin ninguna guía, en el 80% de los casos no vuelve.

**Qué habría que implementar:**
- Detectar si el usuario tiene 0 objetivos y mostrar un estado vacío diferente al estado normal.
- El estado vacío debe tener: un mensaje claro de bienvenida, una explicación de qué es TRAZA en 1–2 líneas, y un CTA principal ("Agregar mi primer objetivo") que lleve directamente al formulario.
- Para el rol empleado: guiar a registrar el primer objetivo.
- Para el rol supervisor: guiar a invitar al primer empleado o revisar el equipo.
- Para el rol admin: guiar a configurar la empresa y agregar el primer supervisor.

**Esfuerzo estimado:** 2–3 días.

---

### 10. Protección por rol en API routes críticas

**Qué es:** Las API routes de Next.js (`/api/feedback`, `/api/1on1`, `/api/narrativa`, etc.) actualmente verifican que el usuario esté autenticado, pero no verifican su rol.

**Por qué es bloqueante (seguridad):** Un empleado autenticado puede hacer una llamada directa a `/api/feedback` y crear o modificar feedback que no le corresponde. En un producto de RRHH que maneja datos de desempeño, esto es una vulnerabilidad seria. Un cliente enterprise que haga un security audit básico lo va a detectar.

**Qué habría que implementar:**
- En cada API route, después de verificar la sesión, verificar el rol del usuario en Supabase.
- Retornar 403 Forbidden si el rol no tiene permiso para esa operación.
- Revisar también el middleware: actualmente solo bloquea rutas sin sesión. Agregar protección por rol para rutas como `/analytics`, `/equipo`, `/reportes`.
- Las Row Level Security (RLS) policies de Supabase son la segunda línea de defensa — verificar que estén activas y correctamente configuradas.

**Esfuerzo estimado:** 3–4 días (depende de cuántas API routes existen y si las RLS están bien configuradas).

---

### 11. Consistencia completa del nombre de marca

**Qué es:** El nombre del producto aparece escrito de formas distintas en distintos lugares del producto.

**Estado actual:**
- Landing: "TRAZA" (mayúsculas)
- Sidebar (ya corregido): "traza" (minúsculas)
- Footer del PDF: "TRAZA · Performance Intelligence"
- Login: "traza"
- El nivel de desempeño: aparece "Élite" con acento y "Elite" sin acento en distintos lugares.

**Qué habría que implementar:**
- Decidir UNA forma de escribirlo y aplicarla globalmente.
- Recomendación: "traza" en minúscula para la marca/logo, "TRAZA" en mayúsculas solo cuando se habla del Índice como metodología ("Índice TRAZA").
- Buscar y reemplazar todas las variantes en el código.
- Definir "Élite" con acento como la forma correcta (es español) y aplicarla en todas las referencias al nivel.

**Esfuerzo estimado:** 1 día.

---

### 12. Corrección del mensaje de login para usuarios individuales

**Qué es:** La página de login dice "Ingresá con tu cuenta de empresa" pero el sistema también acepta (y está diseñado para) usuarios individuales que no pertenecen a ninguna empresa.

**Por qué es bloqueante:** Un individuo que se registra por su cuenta, ve "cuenta de empresa" y piensa que no puede acceder o que se equivocó de producto. Se va.

**Qué habría que implementar:**
- Cambiar el texto a algo más inclusivo: "Ingresá a tu cuenta" o "Accedé a TRAZA".
- Si la intención es diferenciar los flujos, agregar dos opciones claras en el login: "Soy parte de una empresa" / "Tengo cuenta individual".
- Revisar también el copy del registro para que sea consistente.

**Esfuerzo estimado:** Medio día.

---

## 🟡 MUY RECOMENDABLES — Lanzar con esto si es posible

---

### 13. Rate limiting en rutas públicas

**Qué es:** Un límite de requests por IP/minuto en las API routes accesibles sin autenticación o con datos sensibles.

**Por qué importa:** Sin rate limiting, las rutas de validación externa pueden ser abusadas (alguien podría generar miles de solicitudes de validación falsas). Las rutas de login son vulnerables a ataques de fuerza bruta.

**Cómo implementarlo:** Con Upstash Redis + el paquete `@upstash/ratelimit`, se puede agregar en minutos a cualquier API route de Next.js. Upstash tiene free tier. Alternativa: middleware de Vercel con `@vercel/kv`.

**Esfuerzo estimado:** 1–2 días.

---

### 14. Paginación en listas de objetivos y validaciones

**Qué es:** Actualmente todas las queries traen todos los registros de una vez. No hay "cargar más" ni paginación.

**Por qué importa:** Con una empresa que tiene 50 empleados con 20 objetivos cada uno, la página de validación cargaría 1.000 filas de golpe. Con 200 empleados, son 4.000 filas. Eso rompe la performance y la experiencia.

**Cómo implementarlo:** Agregar `.range(offset, offset + pageSize - 1)` a las queries de Supabase. Agregar botones "Ver más" o paginación numérica en la UI. Empezar por las páginas más críticas: `/validacion`, `/equipo`, `/objetivos`.

**Esfuerzo estimado:** 3–4 días.

---

### 15. Logs de auditoría básicos

**Qué es:** Un registro de las acciones importantes que ocurren en el sistema: quién creó qué objetivo, quién validó qué, quién cambió el rol de quién.

**Por qué importa:** En un producto de RRHH enterprise, los logs de auditoría son casi obligatorios. Si hay una disputa entre un empleado y un manager sobre si algo fue validado o no, el sistema necesita poder responder con un historial objetivo.

**Cómo implementarlo:** Crear una tabla `audit_logs` en Supabase con campos: `user_id`, `accion`, `tabla_afectada`, `registro_id`, `datos_anteriores`, `datos_nuevos`, `created_at`. Insertar un log en cada operación crítica (crear objetivo, validar, cambiar rol, etc.).

**Esfuerzo estimado:** 3–4 días para la implementación básica.

---

### 16. Open Graph image para redes sociales

**Qué es:** La imagen que aparece cuando alguien comparte un link de TRAZA en LinkedIn, WhatsApp o Twitter/X.

**Por qué importa:** El canal de adquisición más probable para TRAZA en LATAM es el boca a boca en LinkedIn. Si alguien comparte el link y aparece sin imagen, o con la imagen de Vercel, el CTR cae drásticamente.

**Cómo implementarlo:** Crear una imagen 1200x630px con el logo de TRAZA, el tagline, y un visual del informe o del dashboard. Agregar las meta tags `og:image`, `og:title`, `og:description` en el layout de Next.js. Se puede generar dinámicamente con `@vercel/og` para páginas de perfil público.

**Esfuerzo estimado:** 1 día.

---

### 17. Consentimiento de cookies

**Qué es:** El banner o modal que informa al usuario qué cookies usa el sitio y solicita su consentimiento.

**Por qué importa:** Si TRAZA va a integrar PostHog, Google Analytics o cualquier herramienta de tracking, es legalmente requerido en la mayoría de los mercados. En Argentina la Ley 25.326 aplica. En empresas con clientes europeos, aplica GDPR.

**Cómo implementarlo:** Solución mínima: un banner simple con "Este sitio usa cookies para mejorar la experiencia" + botón Aceptar. Solución correcta: una librería como `cookie-consent` o `react-cookie-consent` que permite granularidad (cookies necesarias vs analytics).

**Esfuerzo estimado:** 1 día.

---

### 18. Gestión de usuarios para el admin

**Qué es:** Una pantalla donde el admin de una empresa pueda ver todos los usuarios, cambiar roles, desactivar cuentas, e invitar nuevos.

**Por qué importa:** Actualmente el admin no tiene forma de gestionar su equipo desde la app. Si un empleado se va de la empresa, no se puede desactivar su cuenta desde la UI. Si hay que cambiar el rol de alguien, requiere intervención manual en la base de datos.

**Qué habría que implementar:**
- Tabla de usuarios con nombre, email, rol, estado (activo/inactivo), fecha de ingreso.
- Botón para cambiar rol (empleado → supervisor, etc.).
- Botón para desactivar/reactivar una cuenta.
- Formulario para invitar nuevos usuarios por email.

**Esfuerzo estimado:** 3–4 días.

---

### 19. Settings de empresa

**Qué es:** Una pantalla de configuración donde el admin puede editar el perfil de su organización: nombre, rubro, logo, plan activo.

**Por qué importa:** Actualmente no hay forma de que una empresa actualice su información. Si cambian de nombre o quieren subir su logo, no pueden hacerlo.

**Qué habría que implementar:**
- Página `/empresa/settings` o `/configuracion`.
- Formulario para editar nombre, rubro, descripción.
- Upload de logo de empresa.
- Sección de plan activo (integrado con billing).

**Esfuerzo estimado:** 2–3 días.

---

### 20. Eliminar o deshabilitar rutas incompletas

**Qué es:** Las rutas `/calendario` y `/buscar-talento` aparecen en el sidebar pero no tienen funcionalidad real o son un producto diferente.

**Por qué importa:** Un usuario que hace clic en "Calendario" y llega a una pantalla vacía o incompleta, pierde confianza en el producto. Es mejor no mostrar algo que mostrarlo roto.

**Qué habría que implementar:**
- Eliminar `/calendario` del sidebar hasta que tenga funcionalidad real.
- Eliminar `/buscar-talento` y `/empleadores` del sidebar (son un HR marketplace diferente).
- Eliminar o archivar `talent-card/page.tsx` del código fuente (ya no está en el sidebar pero sigue en el repo).

**Esfuerzo estimado:** Medio día.

---

### 21. Error monitoring (Sentry)

**Qué es:** Una herramienta que registra automáticamente los errores de JavaScript y de servidor que ocurren en producción, con el stack trace completo.

**Por qué importa:** Sin monitoreo de errores, la única forma de saber que algo está roto es que un usuario se queje. Eso significa que por cada usuario que se queja, 10 abandonaron sin decir nada.

**Cómo implementarlo:** Sentry tiene integración nativa con Next.js. Se instala con `npx @sentry/wizard@latest -i nextjs`. El plan gratuito es suficiente para los primeros meses.

**Esfuerzo estimado:** Medio día.

---

### 22. Analytics de producto (PostHog)

**Qué es:** Una herramienta que registra qué hacen los usuarios dentro de la app: qué páginas visitan, en qué pasos abandonan, qué botones usan más.

**Por qué importa:** Sin analytics, las decisiones de producto se toman a ciegas. PostHog permite ver si los usuarios llegan al paso de agregar su primer objetivo o se van antes, qué porcentaje descarga el informe PDF, y dónde se rompe el funnel.

**Cómo implementarlo:** PostHog tiene SDK para Next.js. El plan gratuito incluye hasta 1 millón de eventos por mes — más que suficiente para el lanzamiento. Se puede combinar con feature flags para rollout controlado de nuevas funciones.

**Esfuerzo estimado:** 1 día.

---

### 23. PWA: manifest.json + íconos para instalación en mobile

**Qué es:** Los archivos que convierten a TRAZA en una Progressive Web App instalable en el celular, sin necesidad de pasar por el App Store ni el Play Store.

**Por qué importa:** Los empleados que registran avances lo hacen en el momento, desde el celular. Una app instalada en el home screen se abre más rápido, funciona offline (parcialmente), y da sensación de producto completo. El costo de implementación es mínimo comparado con una app nativa.

**Qué habría que implementar:**
- Crear `/public/manifest.json` con nombre, colores, íconos en múltiples tamaños.
- Agregar `<link rel="manifest" href="/manifest.json">` en el layout.
- Íconos en 192x192 y 512x512 (se pueden derivar del favicon).
- Opcional: un Service Worker básico para caching de assets estáticos (con `next-pwa`).

**Esfuerzo estimado:** 1 día.

---

## Resumen ejecutivo de esfuerzo

| Área | Items | Días estimados |
|------|-------|----------------|
| Legal (privacidad, T&C, cookies) | 3 items | 2–3 días |
| Auth y seguridad (password recovery, roles, rate limiting) | 3 items | 5–7 días |
| Billing | 1 item | 5–7 días |
| Infraestructura (dominio, email, favicon, PWA) | 4 items | 3–4 días |
| UX y producto (empty states, mobile, marca, login) | 4 items | 5–7 días |
| Gestión (usuarios, settings de empresa) | 2 items | 5–7 días |
| Monitoreo (Sentry, PostHog) | 2 items | 1–2 días |
| Limpieza (rutas, audit logs, paginación, OG) | 4 items | 5–7 días |
| **TOTAL** | **23 items** | **~4 semanas** |

---

*Documento generado en sesión de trabajo TRAZA · Julio 2026*
