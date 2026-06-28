# TRAZA — Resumen de sesión y estado del proyecto · Junio 2026

Este documento resume lo que discutimos en la reunión, lo que ya implementamos y lo que queda pendiente para las próximas sesiones.

---

## Lo que revisamos en la reunión

El punto de partida fue revisar la plataforma con ojos críticos y ver qué no estaba funcionando bien.

Lo primero que notamos fue que los badges de categoría de los objetivos tenían emojis que no pegaban con el estilo profesional que queremos. También había textos mal puestos — por ejemplo, en la sección de validación aparecía "Tu validación" cuando debería decir "Validación del supervisor", porque esa pantalla la ve el supervisor, no el empleado.

Después revisamos el flujo entre empleado y supervisor y vimos que era casi nulo. Los empleados podían cargar avances, pero el supervisor no tenía forma de responderles ni de marcar si había leído o aprobado algo. No había conversación real, solo monólogos.

También vimos un problema con los objetivos que no tienen fecha de vencimiento, como reuniones semanales o hábitos continuos. Al no tener fecha de cierre, el sistema los dejaba como pendientes para siempre, lo cual bajaba el puntaje del empleado sin razón. Eso era injusto.

En cuanto al diseño, la plataforma se veía genérica — muy blanca, muy azul, sin personalidad. Queríamos algo más moderno y profesional.

Y el punto más importante de la reunión fue este: ¿qué pasa si el supervisor está equivocado, es injusto o simplemente no presta atención? En el modelo que teníamos, el puntaje del empleado dependía casi por completo de lo que opine una sola persona. Si esa persona tiene un sesgo, la carrera del empleado queda afectada. Eso no está bien.

---

## Lo que ya implementamos

Los problemas visuales y de texto los resolvimos todos. Se sacaron los emojis, se corrigieron los textos, y se rediseñó la interfaz completa: barra lateral oscura con azul profundo, fondo blanco cálido, tipografía mejorada y un login con diseño mucho más premium.

El flujo de avances ahora funciona como una conversación real. Cuando el empleado carga un avance, aparece como "Sin revisar". El supervisor puede leerlo y responder, con lo cual pasa a "Visto". Y si lo aprueba formalmente, pasa a "Aprobado" con un tilde verde. Esto da visibilidad real de lo que está pasando con cada objetivo.

El problema de los objetivos continuos se resolvió con un tilde de "Sin fecha de vencimiento" que se puede activar en cualquier tipo de objetivo. Cuando está activo, ese objetivo queda fuera del cálculo de cumplimiento y no penaliza el puntaje.

Las estadísticas del equipo muestran evolución por trimestre, distribución de objetivos por tipo y una comparación entre lo que cada persona dice de sí misma y lo que el supervisor valida.

También cargamos historial realista en los objetivos existentes, que antes estaban todos vacíos. Ahora cada uno tiene avances con comentarios, links o archivos, respuestas del supervisor y fechas coherentes.

Los valores de autoevaluación pasaron de "De acuerdo / Parcialmente de acuerdo / En desacuerdo" a "Cumplido / Parcialmente cumplido / No cumplido", que es un lenguaje más directo y natural para revisar el estado de un objetivo. El cambio es retrocompatible: la fórmula acepta tanto los valores viejos como los nuevos sin perder datos históricos.

Y en la pantalla de Validación, ahora cada línea de objetivo muestra los dos badges cuando existen: el del supervisor y el del administrador. Si solo validó uno de los dos, aparece solo ese. Si validaron los dos y son distintos, se ven los dos juntos, lo cual hace visible de un vistazo cuando hay una discrepancia entre ambas opiniones.

La autoevaluación del empleado ahora también es visible para el supervisor en la pantalla de Perfil Profesional. Aparece como un badge en el resumen de cada objetivo y se expande en el detalle, mostrando la calificación y el comentario del propio empleado. Antes esa información existía en la base de datos pero nunca se mostraba al supervisor.

Se corrigió un bug por el cual los comentarios guardados como texto vacío mostraban comillas solas en la pantalla (""). Ahora la UI verifica que el texto tenga contenido real antes de mostrarlo.

---

## El cambio más importante — el TRAZA Score v3

Este es el punto que más nos importa porque ataca el problema de raíz: ¿cómo se mide el desempeño de una persona de forma justa, sin que dependa de una sola fuente de opinión?

### El problema con el modelo anterior

El modelo anterior tenía dos índices separados: el TRAZA validado (basado en supervisores) y el Dual (que combinaba el validado con una medida de actividad en la plataforma). El problema era que ambos vivían en lugares distintos de la interfaz y mostraban números diferentes para la misma persona — generando confusión. El Dual también penalizaba a empleados que tenían excelentes validaciones pero no usaban la plataforma con frecuencia, lo cual no es un indicador de desempeño real.

### La solución — cinco dimensiones integradas en un solo score

Reemplazamos el sistema de dos índices por un único score unificado con cinco dimensiones, todas integradas en la misma fórmula. El número que ve el empleado en su perfil, en la credencial pública y en el ranking interno es siempre el mismo.

**Resultados validados (35%)** — Lo más importante sigue siendo lo que validaron los supervisores y administradores. Pero en lugar de depender de una sola fuente, la fórmula pondera las tres disponibles: supervisor (peso completo), administrador si revisó (peso completo), y autoevaluación del empleado (peso parcial). Ninguna fuente sola domina el resultado.

**Cumplimiento (25%)** — Porcentaje de objetivos con fecha de vencimiento que fueron completados a tiempo. Los objetivos sin fecha o marcados como continuos no penalizan.

**Proactividad (20%)** — Esta dimensión reemplaza al antiguo "comportamiento autónomo" del Dual, pero con un criterio más justo. No mide cuántos avances se cargaron en total, sino la regularidad semanal: qué porcentaje de semanas activas el empleado registró al menos un avance. Alguien que carga un avance cada lunes durante dos meses puntúa igual que alguien que carga diez en un día y desaparece. La constancia importa más que el volumen.

**Alineación (10%)** — Mide qué tan bien coincide la autoevaluación del empleado con la validación del supervisor. Alta alineación significa que la persona tiene conciencia real de su propio desempeño. Baja alineación, especialmente si la persona se sobrevalora sistemáticamente, es una señal de madurez profesional a desarrollar.

**Evolución (10%)** — Compara el desempeño de los últimos 90 días con el período anterior de 90 días. Quien mejora sube. Quien baja, baja. Quien se mantiene estable recibe un puntaje neutro. Esta dimensión premia el crecimiento continuo y detecta tendencias negativas antes de que sean un problema.

La fórmula final es: 35% + 25% + 20% + 10% + 10% = 100%. El score va de 0 a 100 y se muestra idéntico en el perfil interno, la talent card y la credencial pública.

### Lo que se eliminó

El Índice Dual fue discontinuado. Las dimensiones que medía bien (regularidad de actividad, precisión de autoevaluación) quedaron absorbidas en Proactividad y Alineación, dentro del score principal. La sección de "Alertas de sesgo de supervisor" también se removió de Analytics, ya que la nueva fórmula distribuye las fuentes de validación y no depende de una sola voz.

---

## La credencial pública — rediseño completo

La credencial es el documento que el empleado puede compartir externamente con cualquier empresa o reclutador. Se rediseñó desde cero con un criterio claro: mostrar solo lo que le importa a alguien de afuera, sin terminología interna de la plataforma.

El score principal ahora es el TRAZA Score (el mismo que en todos los demás lugares). Las cinco barras del índice muestran cada dimensión con su peso en porcentaje. El historial de empresas muestra el recorrido profesional con score por empresa. La sección de validaciones muestra el porcentaje de calificaciones positivas con un gráfico de distribución. Y la sección de "Trayectoria profesional" es un párrafo generado por inteligencia artificial en tiempo real, usando todos los datos del empleado — historial completo, sectores, cantidad de objetivos completados y validados, score global — para producir tres oraciones en tono formal y orientado a resultados. El sistema usa Claude Haiku y hace el llamado en el servidor en el momento de abrir la credencial.

---

## Lo que queda por implementar

El sistema de invitaciones es la prioridad operativa más urgente. Hoy para agregar un usuario hay que hacerlo manualmente. La idea es que el administrador genere un link con el rol ya asignado, la persona lo abra, complete sus datos y quede registrada automáticamente en la empresa correcta.

La pantalla de Analytics puede mejorarse para incorporar las nuevas dimensiones del score v3: mostrar qué empleados tienen alta Proactividad pero bajos Resultados (puede indicar esfuerzo sin dirección), o quiénes tienen alta Alineación (señal de madurez). Las nuevas dimensiones abren posibilidades de análisis que antes no existían.

La integración de IA para el perfil interno (narrativa personalizada por empleado dentro de la plataforma) ya está parcialmente implementada con un botón de generación manual. Queda pendiente pulir la experiencia y explorar si tiene sentido regenerarla automáticamente en ciertos eventos.

Y a largo plazo, el objetivo es abrir la plataforma para que cualquier empresa pueda registrarse y usarla con sus propios equipos, de forma completamente separada e independiente.
