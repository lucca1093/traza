/**
 * Rate limiter en memoria — protege endpoints públicos contra spam.
 * Funciona por IP + endpoint. Límite: N requests por ventana de tiempo.
 *
 * Nota: en entornos serverless cada instancia tiene su propia memoria,
 * así que el límite es por instancia. Para un tope global se necesitaría
 * Redis, pero esto es suficiente para frenar el 99% de los ataques simples.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Limpia entradas viejas cada 5 minutos para no crecer indefinidamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * @param ip        IP del cliente
 * @param endpoint  Identificador del endpoint (ej: 'checkout')
 * @param max       Máximo de requests permitidos en la ventana
 * @param windowMs  Duración de la ventana en milisegundos
 * @returns true si la request está permitida, false si hay que bloquearla
 */
export function checkRateLimit(
  ip: string,
  endpoint: string,
  max: number,
  windowMs: number
): boolean {
  const key = `${ip}:${endpoint}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false

  entry.count++
  return true
}

/** Helper para obtener la IP real del request */
export function getIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/**
 * Rate limit específico para endpoints de IA (por userId).
 * Límite: 30 llamadas por usuario por hora.
 */
export function checkAIRateLimit(userId: string): boolean {
  return checkRateLimit(userId, 'ai', 30, 60 * 60 * 1000)
}

/**
 * AbortSignal con timeout de 30 segundos.
 * Usar en cada fetch a Anthropic para evitar llamadas colgadas.
 */
export function aiSignal(): AbortSignal {
  return AbortSignal.timeout(30_000)
}
