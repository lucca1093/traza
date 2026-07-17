TRAZA — Lo que falta antes de lanzar
Julio 2026


LO QUE NO PUEDE FALTAR (si falta esto, no lanzamos)


1. Sistema de cobro

Hoy no hay ninguna forma de que alguien pague por TRAZA. Si una empresa quiere contratar, no puede hacerlo sola — tendríamos que hacer todo a mano. Hay que integrar una pasarela de pago (tipo Stripe o MercadoPago), armar al menos un plan con precio, y que el botón de "contratar" realmente lleve a pagar. Sin esto no hay negocio.


2. "Olvidé mi contraseña"

Si alguien pierde el acceso a su cuenta, hoy no puede recuperarla. Tendríamos que entrar nosotros a la base de datos a arreglarlo manualmente. Hay que agregar el flujo básico de recuperación por email que tiene cualquier app.


3. Dominio propio

La app hoy vive en una dirección de Vercel (algo como traza-app.vercel.app). Mandarle eso a un cliente da sensación de prototipo. Hay que tener el dominio propio (traza.app o el que elijamos) apuntando a la app. Es un trámite de configuración, no de programación.


4. Que los emails lleguen de verdad

TRAZA manda emails automáticos cuando alguien solicita una validación externa. El problema es que sin configurar bien el dominio en el servicio de emails, esos mensajes o no llegan o van a spam. Hay que terminar esa configuración para que el flujo de validación — que es uno de los grandes diferenciales del producto — funcione de punta a punta.


5. Política de Privacidad

TRAZA maneja datos laborales de personas: sus objetivos, sus evaluaciones, el feedback de sus jefes. Son datos sensibles. Sin una Política de Privacidad publicada, en Argentina (y en toda LATAM) hay riesgo legal. Además, cualquier empresa grande que evalúe contratar TRAZA lo primero que va a pedir es esto. No hace falta que sea un documento enorme, pero tiene que existir y estar publicado.


6. Términos y Condiciones

Es el contrato entre TRAZA y quien lo usa. Define qué se puede hacer, qué no, y qué pasa si hay un problema. Sin esto no hay marco legal para ninguna relación comercial. Va de la mano con la Política de Privacidad.


7. Ícono de la app

Cuando alguien abre TRAZA en el navegador, la pestaña muestra el ícono genérico de Vercel (el triángulo). Es el equivalente a una tarjeta de presentación sin logo. Hay que poner el ícono de TRAZA. Es un detalle chico pero comunica mucho.


8. Que funcione bien en el celular

El sidebar de navegación hoy ocupa parte de la pantalla en mobile y corta el contenido. Los empleados que registran avances lo hacen en el momento, desde el teléfono. Si la app se ve rota en mobile, se van. Hay que ajustar el diseño para que funcione bien en pantallas chicas.


9. Pantalla de bienvenida para usuarios nuevos

Cuando alguien se registra por primera vez y entra al dashboard, ve una pantalla casi vacía sin ninguna indicación de qué hacer. La mayoría de los usuarios que llegan a ese estado no vuelven. Hay que agregar un mensaje de bienvenida claro con un botón que diga "Agregá tu primer objetivo" o algo similar que los lleve a la primera acción.


10. Que cada usuario solo pueda ver lo que le corresponde

Hoy si un empleado conoce la URL de la sección de analytics o reportes, puede entrar directamente aunque su perfil no debería permitirlo. Hay que asegurarse de que cada rol solo pueda acceder a lo que le corresponde, desde cualquier camino que intente.


11. Un solo nombre, una sola forma de escribirlo

En algunos lugares dice "TRAZA" (todo mayúsculas), en otros dice "traza" (todo minúsculas). En el PDF dice "TRAZA · Performance Intelligence". El nivel "Élite" aparece a veces con acento y a veces sin. Hay que definir una forma única y aplicarla en todos lados. Parece un detalle pero da sensación de producto sin terminar.


12. Corregir el mensaje de la pantalla de login

La pantalla de ingreso dice "Ingresá con tu cuenta de empresa". Pero TRAZA también acepta usuarios individuales que no tienen empresa. Alguien que se registró de forma individual llega ahí y piensa que se equivocó. Hay que cambiar ese texto para que sea claro para todos.


---


LO QUE CONVIENE TENER ANTES DE LANZAR (no bloquea, pero suma mucho)


13. Límite de intentos en formularios públicos

Hay formularios que cualquiera puede usar sin estar registrado (como el de validación externa). Sin un límite de intentos, alguien malintencionado podría mandar miles de solicitudes falsas y colapsar el sistema. Es una protección básica.


14. Que las listas no traigan todo de una vez

Si una empresa tiene 100 empleados con 20 objetivos cada uno, la pantalla de validación intentaría cargar 2.000 registros al mismo tiempo. Eso la haría lenta o la rompería. Hay que agregar un "ver más" o paginación para cargar los datos de a poco.


15. Registro de acciones importantes

Si mañana hay una disputa entre un empleado y su jefe sobre si algo fue validado o no, hoy no hay forma de saber exactamente qué pasó y cuándo. Para un producto de RRHH es casi obligatorio tener un registro histórico de las acciones clave: quién aprobó qué, cuándo, quién cambió qué.


16. Imagen al compartir en redes

Si alguien comparte un link de TRAZA en LinkedIn o WhatsApp, hoy no aparece ninguna imagen de preview — o aparece algo genérico. Para un producto que se va a vender a través del boca a boca en LinkedIn, esto importa. Hay que crear una imagen de presentación del producto que aparezca cuando se comparte el link.


17. Aviso de cookies

Si vamos a usar herramientas de análisis de uso (lo cual es recomendable), por ley hay que avisarle al usuario que el sitio usa cookies y pedirle que lo acepte. Es el banner que aparece en la mayoría de los sitios. Chico pero necesario legalmente.


18. Panel para administrar el equipo

El administrador de una empresa hoy no puede hacer nada con los usuarios desde la app: no puede cambiarle el rol a alguien, no puede desactivar a un empleado que se fue, no puede invitar nuevos. Todo eso requiere que nosotros lo hagamos a mano. Hay que darle al admin una pantalla para gestionar su equipo de forma autónoma.


19. Configuración de la empresa

No hay ningún lugar donde una empresa pueda editar su propia información: su nombre, su rubro, subir su logo. Hay que agregar esa pantalla de configuración básica.


20. Sacar las secciones que no funcionan

En el menú lateral aparecen opciones como "Calendario" que al hacerles clic no hacen nada útil, y "Buscar Talento" que es directamente otro producto distinto. Eso da sensación de app incompleta. Mejor quitarlas hasta que estén listas.


21. Sistema de alertas de errores

Hoy si algo se rompe en producción, nos enteramos cuando un usuario se queja. Por cada usuario que avisa, hay diez que se fueron sin decir nada. Hay herramientas gratuitas que nos avisan automáticamente cuando algo falla, con el detalle de qué pasó.


22. Entender qué hacen los usuarios dentro de la app

Sin datos de uso, tomamos decisiones a ciegas. Herramientas como PostHog (gratuitas) nos permiten ver en qué paso del proceso se van los usuarios, qué funciones usan más, dónde se traban. Es información clave para mejorar el producto después del lanzamiento.


23. Que se pueda instalar en el celular como una app

Sin necesidad de pasar por el App Store ni el Play Store, se puede hacer que TRAZA se pueda instalar en el teléfono como si fuera una app nativa. Aparece en el home screen, se abre rápido, funciona mejor. El costo de implementación es mínimo comparado con desarrollar una app nativa.


---


En resumen: con 4 semanas de trabajo enfocado, TRAZA puede estar genuinamente listo para su primera venta. El producto ya tiene un núcleo muy sólido y un nivel de diseño que supera a muchos productos en esta etapa. Lo que falta son las capas de confianza que un cliente real necesita ver para dar el sí.
