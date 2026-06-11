import streamlit as st
import sqlite3
import pandas as pd
usuarios = {

    "lucca": {
        "password": "123",
        "rol": "empleado",
        "persona": "Lucca Lofredo"
    },

    "supervisor": {
        "password": "123",
        "rol": "supervisor",
        "persona": "Juan Pérez"
    },

    "admin": {
        "password": "123",
        "rol": "admin",
        "persona": "Administrador"
    }

}

def tiene_acceso(pagina, rol):

    permisos = {
        "admin": [
            "Inicio",
            "Personas",
            "Plan de Trabajo",
            "Validación",
            "Analytics",
            "Perfil Profesional",
            "🏆 Talent Card",
            "Reportes",
            "Guía"
        ],
        "empleado": [
            "Inicio",
            "Plan de Trabajo",
            "Perfil Profesional",
            "🏆 Talent Card",
            "Guía"
        ],
        "supervisor": [
            "Inicio",
            "Validación",
            "Analytics",
            "🏆 Talent Card",
            "Reportes",
            "Guía"
        ]
    }

    return pagina in permisos[rol]

conn = sqlite3.connect(
    "performance.db",
    check_same_thread=False
)

cursor = conn.cursor()

st.set_page_config(
    page_title="Traza",
    page_icon="📈",
    layout="wide"
)

st.markdown("""
<style>

.main {
    padding-top: 1rem;
}

.block-container {
    padding-top: 2rem;
    padding-bottom: 3rem;
}

h1 {
    color: #0F4C81;
    font-weight: 800;
    letter-spacing: -0.5px;
}

h2, h3 {
    color: #1F2937;
    font-weight: 700;
}

p {
    color: #4B5563;
}

[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%);
    border-right: 1px solid #E5E7EB;
}

div[data-testid="metric-container"] {
    border: 1px solid #E5E7EB;
    padding: 22px;
    border-radius: 16px;
    background-color: white;
    box-shadow: 0 8px 20px rgba(15, 76, 129, 0.06);
}

.stAlert {
    border-radius: 14px;
}

[data-testid="stDataFrame"] {
    border-radius: 14px;
    overflow: hidden;
}

button {
    border-radius: 10px !important;
}

hr {
    margin-top: 28px;
    margin-bottom: 28px;
}

</style>
""", unsafe_allow_html=True)

st.sidebar.markdown(
    """
    # 📈 TRAZA

    ### Performance Intelligence Platform

    ---
    
    Construí, validá y visualizá desempeño profesional basado en resultados verificables.
    """
)

if "login" not in st.session_state:

    st.session_state.login = False

if st.session_state.login == False:

    usuario = st.sidebar.text_input(
        "Usuario"
    )

    password = st.sidebar.text_input(
        "Contraseña",
        type="password"
    )

    if st.sidebar.button(
        "Ingresar"
    ):

        if usuario in usuarios:

            if usuarios[usuario]["password"] == password:

                st.session_state.login = True

                st.session_state.usuario = usuario

                st.session_state.rol = usuarios[usuario]["rol"]

                st.session_state.persona = usuarios[usuario]["persona"]

                st.rerun()

    st.stop()

st.sidebar.divider()

st.sidebar.caption(
    "Desempeño profesional verificable"
)

rol = st.session_state.rol

if rol == "admin":

    opciones_menu = [
        "Inicio",
        "Personas",
        "Plan de Trabajo",
        "Validación",
        "Analytics",
        "Perfil Profesional",
        "🏆 Talent Card",
        "Reportes",
        "Guía"
    ]

elif rol == "empleado":

    opciones_menu = [
        "Inicio",
        "Plan de Trabajo",
        "Perfil Profesional",
        "🏆 Talent Card",
        "Guía"
    ]

elif rol == "supervisor":

    opciones_menu = [
        "Inicio",
        "Validación",
        "Analytics",
        "🏆 Talent Card",
        "Reportes",
        "Guía"
    ]

pagina = st.sidebar.selectbox(
    "Menú",
    opciones_menu
)

if not tiene_acceso(
    pagina,
    st.session_state.rol
):

    st.error(
        "No tenés permiso para acceder a esta sección."
    )

    st.stop()

st.sidebar.caption(
    f"Sesión: {st.session_state.persona} · {st.session_state.rol}"
)

if st.sidebar.button("Cerrar sesión"):

    st.session_state.login = False

    st.rerun()

# =========================
# INICIO
# =========================

if pagina == "Inicio":

    st.markdown(
        """
        <div style="
            background-color:#F8FAFC;
            border:1px solid #E5E7EB;
            border-radius:18px;
            padding:32px;
            margin-bottom:24px;
        ">
            <h1 style="margin-bottom:8px; color:#0F4C81;">
                📈 TRAZA
            </h1>
            <h3 style="margin-top:0; color:#1F2937;">
                Desempeño profesional verificable
            </h3>
            <p style="font-size:18px; color:#4B5563; max-width:850px;">
                Centralizá objetivos, validaciones y evidencia de desempeño
                en una única plataforma. Traza transforma el trabajo realizado
                en información medible, validada y trazable.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    cursor.execute(
        "SELECT COUNT(*) FROM personas"
    )

    total_personas = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM objetivos"
    )

    total_objetivos = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM objetivos
        WHERE estado='Completado'
        """
    )

    completados = cursor.fetchone()[0]

    cumplimiento = 0

    if total_objetivos > 0:

        cumplimiento = round(
            completados / total_objetivos * 100,
            1
        )

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "👥 Personas",
            total_personas
        )

    with col2:
        st.metric(
            "🎯 Objetivos",
            total_objetivos
        )

    with col3:
        st.metric(
            "✅ Completados",
            completados
        )

    with col4:
        st.metric(
            "📈 Cumplimiento",
            f"{cumplimiento}%"
        )

    st.divider()

    col_a, col_b, col_c = st.columns(3)

    with col_a:
        st.info(
            "🎯 Registrá objetivos claros, medibles y trazables."
        )

    with col_b:
        st.success(
            "✅ Validá resultados con supervisores."
        )

    with col_c:
        st.warning(
            "🏆 Construí un historial profesional verificable."
        )

    st.caption(
        "Versión MVP • Traza Performance Platform"
    )

# =========================
# PERSONAS
# =========================

elif pagina == "Personas":

    st.title("👥 Personas")

    st.subheader("Crear persona")

    nombre = st.text_input("Nombre")
    apellido = st.text_input("Apellido")
    cargo = st.text_input("Cargo")
    area = st.text_input("Área")
    supervisor = st.text_input("Supervisor")

    if st.button("Guardar Persona"):

        cursor.execute(
            """
            INSERT INTO personas
            (nombre, apellido, cargo, area, supervisor)
            VALUES (?, ?, ?, ?, ?)
            """,
            (nombre, apellido, cargo, area, supervisor)
        )

        conn.commit()
        st.success("Persona guardada correctamente")
        st.rerun()

    st.divider()

    st.subheader("Personas registradas")

    cursor.execute(
        """
        SELECT id, nombre, apellido, cargo, area, supervisor
        FROM personas
        """
    )

    personas = cursor.fetchall()

    if len(personas) == 0:

        st.info("Todavía no hay personas registradas.")

    else:

        df_personas = pd.DataFrame(
            personas,
            columns=[
                "ID",
                "Nombre",
                "Apellido",
                "Cargo",
                "Área",
                "Supervisor"
            ]
        )

        st.dataframe(df_personas, use_container_width=True)

        st.divider()

        st.subheader("Editar persona")

        opciones_editar = {
            f"{fila[1]} {fila[2]} (ID {fila[0]})": fila
            for fila in personas
        }

        persona_editar = st.selectbox(
            "Seleccionar persona a editar",
            list(opciones_editar.keys())
        )

        persona = opciones_editar[persona_editar]

        nuevo_cargo = st.text_input(
            "Nuevo cargo",
            value=persona[3]
        )

        nueva_area = st.text_input(
            "Nueva área",
            value=persona[4]
        )

        nuevo_supervisor = st.text_input(
            "Nuevo supervisor",
            value=persona[5]
        )

        if st.button("Guardar cambios"):

            cursor.execute(
                """
                UPDATE personas
                SET cargo = ?, area = ?, supervisor = ?
                WHERE id = ?
                """,
                (
                    nuevo_cargo,
                    nueva_area,
                    nuevo_supervisor,
                    persona[0]
                )
            )

            conn.commit()
            st.success("Persona actualizada correctamente")
            st.rerun()

        st.divider()

        st.subheader("Eliminar persona")

        opciones_borrar = {
            f"{fila[1]} {fila[2]} (ID {fila[0]})": fila[0]
            for fila in personas
        }

        persona_borrar = st.selectbox(
            "Seleccionar persona a eliminar",
            list(opciones_borrar.keys())
        )

        if st.button("🗑 Eliminar persona"):

            cursor.execute(
                """
                DELETE FROM personas
                WHERE id = ?
                """,
                (opciones_borrar[persona_borrar],)
            )

            conn.commit()
            st.success("Persona eliminada correctamente")
            st.rerun()

# =========================
# OBJETIVOS
# =========================

elif pagina == "Plan de Trabajo":

    st.title("🎯 Plan de Trabajo")

    cursor.execute(
        """
        SELECT
        nombre,
        apellido
        FROM personas
        """
    )

    personas = cursor.fetchall()

    lista_personas = [
        f"{nombre} {apellido}"
        for nombre, apellido in personas
    ]

    if len(lista_personas) == 0:

        st.warning(
            "Primero debes crear una persona en la sección Personas."
        )

    else:

        # =========================
        # CREAR OBJETIVO
        # =========================

        st.subheader("Crear objetivo")

        if st.session_state.rol == "admin":

            empleado = st.selectbox(
                "Empleado",
                lista_personas
            )

        else:

            empleado = st.session_state.persona

            st.info(
                f"Empleado: {empleado}"
            )

        titulo = st.text_input(
            "Título del objetivo"
        )

        descripcion = st.text_area(
            "Descripción"
        )

        prioridad = st.selectbox(
            "Prioridad",
            [
                "Alta",
                "Media",
                "Baja"
            ]
        )

        fecha_limite = st.date_input(
            "Fecha límite"
        )

        estado = st.selectbox(
            "Estado",
            [
                "Pendiente",
                "En progreso",
                "Completado"
            ]
        )

        evidencia = st.text_input(
            "Link de evidencia"
        )

        if st.button("Guardar Objetivo"):

            cursor.execute(
                """
                INSERT INTO objetivos
                (
                    empleado,
                    titulo,
                    descripcion,
                    prioridad,
                    fecha_limite,
                    estado,
                    evidencia
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    empleado,
                    titulo,
                    descripcion,
                    prioridad,
                    str(fecha_limite),
                    estado,
                    evidencia
                )
            )

            conn.commit()

            st.success(
                "Objetivo guardado correctamente"
            )

            st.rerun()

        st.divider()

        # =========================
        # VER OBJETIVOS
        # =========================

        st.subheader(
            "Objetivos registrados"
        )

        cursor.execute(
            """
            SELECT
            id,
            empleado,
            titulo,
            descripcion,
            prioridad,
            fecha_limite,
            estado,
            evidencia
            FROM objetivos
            """
        )

        datos = cursor.fetchall()

        if len(datos) == 0:

            st.info(
                "Todavía no hay objetivos registrados."
            )

        else:

            df_objetivos = pd.DataFrame(
                datos,
                columns=[
                    "ID",
                    "Empleado",
                    "Título",
                    "Descripción",
                    "Prioridad",
                    "Fecha límite",
                    "Estado",
                    "Evidencia"
                ]
            )

            st.dataframe(
                df_objetivos,
                use_container_width=True
            )

            st.divider()

            # =========================
            # EDITAR OBJETIVO
            # =========================

            st.subheader(
                "Editar objetivo"
            )

            opciones_editar = {
                f"{fila[1]} - {fila[2]} (ID {fila[0]})": fila
                for fila in datos
            }

            objetivo_editar = st.selectbox(
                "Seleccionar objetivo a editar",
                list(opciones_editar.keys())
            )

            objetivo = opciones_editar[
                objetivo_editar
            ]

            nuevo_titulo = st.text_input(
                "Nuevo título",
                value=objetivo[2]
            )

            nueva_descripcion = st.text_area(
                "Nueva descripción",
                value=objetivo[3]
            )

            nueva_prioridad = st.selectbox(
                "Nueva prioridad",
                [
                    "Alta",
                    "Media",
                    "Baja"
                ],
                index=[
                    "Alta",
                    "Media",
                    "Baja"
                ].index(objetivo[4])
            )

            nuevo_estado = st.selectbox(
                "Nuevo estado",
                [
                    "Pendiente",
                    "En progreso",
                    "Completado"
                ],
                index=[
                    "Pendiente",
                    "En progreso",
                    "Completado"
                ].index(objetivo[6])
            )

            nueva_evidencia = st.text_input(
                "Nuevo link de evidencia",
                value=objetivo[7] if objetivo[7] else ""
            )

            if st.button(
                "Guardar cambios del objetivo"
            ):

                cursor.execute(
                    """
                    UPDATE objetivos
                    SET
                    titulo = ?,
                    descripcion = ?,
                    prioridad = ?,
                    estado = ?,
                    evidencia = ?
                    WHERE id = ?
                    """,
                    (
                        nuevo_titulo,
                        nueva_descripcion,
                        nueva_prioridad,
                        nuevo_estado,
                        nueva_evidencia,
                        objetivo[0]
                    )
                )

                conn.commit()

                st.success(
                    "Objetivo actualizado correctamente"
                )

                st.rerun()

            st.divider()

            # =========================
            # ELIMINAR OBJETIVO
            # =========================

            st.subheader(
                "Eliminar objetivo"
            )

            opciones_borrar = {
                f"{fila[1]} - {fila[2]} (ID {fila[0]})": fila[0]
                for fila in datos
            }

            objetivo_borrar = st.selectbox(
                "Seleccionar objetivo a eliminar",
                list(opciones_borrar.keys())
            )

            if st.button(
                "🗑 Eliminar objetivo"
            ):

                cursor.execute(
                    """
                    DELETE FROM objetivos
                    WHERE id = ?
                    """,
                    (
                        opciones_borrar[
                            objetivo_borrar
                        ],
                    )
                )

                conn.commit()

                st.success(
                    "Objetivo eliminado correctamente"
                )

                st.rerun()

# =========================
# SUPERVISOR
# =========================

elif pagina == "Validación":

    st.title("👨‍💼 Validación Supervisor")

    cursor.execute(
        """
        SELECT
        id,
        empleado,
        titulo
        FROM objetivos
        """
    )

    objetivos = cursor.fetchall()

    if len(objetivos) == 0:

        st.warning(
            "Todavía no hay objetivos cargados."
        )

    else:

        seleccion = st.selectbox(
            "Seleccionar objetivo",
            objetivos
        )

        validacion = st.selectbox(
            "Resultado",
            [
                "De acuerdo",
                "Parcialmente de acuerdo",
                "En desacuerdo"
            ]
        )

        comentario = st.text_area(
            "Comentario del supervisor"
        )

        if st.button(
            "Guardar validación"
        ):

            cursor.execute(
                """
                UPDATE objetivos
                SET
                validacion = ?,
                comentario_supervisor = ?
                WHERE id = ?
                """,
                (
                    validacion,
                    comentario,
                    seleccion[0]
                )
            )

            conn.commit()

            st.success(
                "Validación guardada correctamente"
            )

# =========================
# DASHBOARD
# =========================

elif pagina == "Analytics":

    st.title("📈 Analytics Organizacional")

    st.caption(
        "Indicadores consolidados de desempeño, cumplimiento y validación."
    )

    # =========================
    # KPIs PRINCIPALES
    # =========================

    cursor.execute(
        "SELECT COUNT(*) FROM objetivos"
    )
    total_objetivos = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM objetivos
        WHERE estado='Completado'
        """
    )
    completados = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM objetivos
        WHERE validacion='De acuerdo'
        """
    )
    aprobados = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM personas
        """
    )
    total_personas = cursor.fetchone()[0]

    cumplimiento = 0

    if total_objetivos > 0:
        cumplimiento = round(
            aprobados / total_objetivos * 100,
            1
        )

    # =========================
    # ÍNDICE ORGANIZACIONAL
    # =========================

    cursor.execute(
        """
        SELECT
            empleado,
            COUNT(*) as total_objetivos,
            SUM(
                CASE
                    WHEN estado='Completado'
                    THEN 10
                    ELSE 0
                END
                +
                CASE
                    WHEN validacion='De acuerdo'
                    THEN 10
                    WHEN validacion='Parcialmente de acuerdo'
                    THEN 5
                    WHEN validacion='En desacuerdo'
                    THEN -10
                    ELSE 0
                END
            ) as puntos
        FROM objetivos
        GROUP BY empleado
        """
    )

    empleados_score = cursor.fetchall()

    indice_organizacional = 0

    if len(empleados_score) > 0:

        suma_indices = 0

        for empleado, total_objetivos_empleado, puntos in empleados_score:

            if puntos is None:
                puntos = 0

            max_puntos = total_objetivos_empleado * 20

            indice = 0

            if max_puntos > 0:
                indice = (puntos / max_puntos) * 100

            if indice < 0:
                indice = 0

            if indice > 100:
                indice = 100

            suma_indices += indice

        indice_organizacional = round(
            suma_indices / len(empleados_score),
            1
        )

    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        st.metric(
            "🎯 Objetivos",
            total_objetivos
        )

    with col2:
        st.metric(
            "✅ Completados",
            completados
        )

    with col3:
        st.metric(
            "📈 Cumplimiento",
            f"{cumplimiento}%"
        )

    with col4:
        st.metric(
            "👥 Personas",
            total_personas
        )

    with col5:
        st.metric(
            "🏢 Índice Org.",
            f"{indice_organizacional}/100"
        )

    st.divider()

    # =========================
    # TOP PERFORMER
    # =========================

    top_empleado = None
    top_indice = 0

    for empleado, total_objetivos_empleado, puntos in empleados_score:

        if puntos is None:
            puntos = 0

        max_puntos = total_objetivos_empleado * 20

        indice = 0

        if max_puntos > 0:
            indice = round(
                (puntos / max_puntos) * 100,
                1
            )

        if indice < 0:
            indice = 0

        if indice > 100:
            indice = 100

        if indice > top_indice:
            top_indice = indice
            top_empleado = empleado

    if top_empleado is not None:

        st.markdown("### 🏆 Top Performer")

        st.markdown(
            f"""
            <div style="
                background-color:#F8FAFC;
                border:1px solid #E5E7EB;
                border-radius:16px;
                padding:24px;
                margin-top:10px;
                margin-bottom:20px;
            ">
                <h2 style="margin-bottom:4px;">{top_empleado}</h2>
                <p style="font-size:18px; color:#4B5563;">
                    Índice Traza
                </p>
                <h1 style="color:#0F4C81; margin-top:0;">
                    {top_indice}/100
                </h1>
            </div>
            """,
            unsafe_allow_html=True
        )

    # =========================
    # RECONOCIMIENTOS
    # =========================

    st.subheader("🏅 Reconocimientos")

    cursor.execute(
        """
        SELECT
            empleado,
            COUNT(*) as completados
        FROM objetivos
        WHERE estado = 'Completado'
        GROUP BY empleado
        ORDER BY completados DESC
        LIMIT 1
        """
    )
    mayor_cumplimiento = cursor.fetchone()

    cursor.execute(
        """
        SELECT
            empleado,
            COUNT(*) as positivas
        FROM objetivos
        WHERE validacion = 'De acuerdo'
        GROUP BY empleado
        ORDER BY positivas DESC
        LIMIT 1
        """
    )
    mas_positivas = cursor.fetchone()

    col_a, col_b = st.columns(2)

    with col_a:

        if mayor_cumplimiento:

            st.info(
                f"📈 Mayor cumplimiento: {mayor_cumplimiento[0]} ({mayor_cumplimiento[1]} objetivos completados)"
            )

        else:

            st.info(
                "📈 Mayor cumplimiento: sin datos suficientes"
            )

    with col_b:

        if mas_positivas:

            st.success(
                f"⭐ Más validaciones positivas: {mas_positivas[0]} ({mas_positivas[1]} validaciones)"
            )

        else:

            st.success(
                "⭐ Más validaciones positivas: sin datos suficientes"
            )

    st.divider()

    # =========================
    # ESTADO DE OBJETIVOS
    # =========================

    st.subheader(
        "📌 Estado de Objetivos"
    )

    cursor.execute(
        """
        SELECT estado, COUNT(*)
        FROM objetivos
        GROUP BY estado
        """
    )

    estados = cursor.fetchall()

    if len(estados) > 0:

        df_estados = pd.DataFrame(
            estados,
            columns=[
                "Estado",
                "Cantidad"
            ]
        )

        st.bar_chart(
            df_estados.set_index(
                "Estado"
            )
        )

    else:

        st.info(
            "Todavía no hay objetivos registrados."
        )

    st.divider()

    # =========================
    # DISTRIBUCIÓN PRIORIDADES
    # =========================

    st.subheader(
        "📊 Distribución de Prioridades"
    )

    cursor.execute(
        """
        SELECT
        prioridad,
        COUNT(*)
        FROM objetivos
        GROUP BY prioridad
        """
    )

    prioridades = cursor.fetchall()

    if len(prioridades) > 0:

        df_prioridades = pd.DataFrame(
            prioridades,
            columns=[
                "Prioridad",
                "Cantidad"
            ]
        )

        st.bar_chart(
            df_prioridades.set_index(
                "Prioridad"
            )
        )

    else:

        st.info(
            "Todavía no hay prioridades registradas."
        )

    st.divider()

    # =========================
    # DISTRIBUCIÓN VALIDACIONES
    # =========================

    st.subheader(
        "✅ Distribución de Validaciones"
    )

    cursor.execute(
        """
        SELECT
        validacion,
        COUNT(*)
        FROM objetivos
        WHERE validacion IS NOT NULL
        GROUP BY validacion
        """
    )

    validaciones = cursor.fetchall()

    if len(validaciones) > 0:

        df_validaciones = pd.DataFrame(
            validaciones,
            columns=[
                "Validación",
                "Cantidad"
            ]
        )

        st.bar_chart(
            df_validaciones.set_index(
                "Validación"
            )
        )

    else:

        st.info(
            "Todavía no hay validaciones registradas."
        )

    st.divider()

    # =========================
    # RANKING TRAZA
    # =========================

    st.subheader(
        "🏆 Ranking Traza"
    )

    ranking = []

    for empleado, total_objetivos_empleado, puntos in empleados_score:

        if puntos is None:
            puntos = 0

        max_puntos = total_objetivos_empleado * 20

        indice = 0

        if max_puntos > 0:
            indice = round(
                (puntos / max_puntos) * 100,
                1
            )

        if indice < 0:
            indice = 0

        if indice > 100:
            indice = 100

        ranking.append(
            (
                empleado,
                total_objetivos_empleado,
                indice
            )
        )

    ranking = sorted(
        ranking,
        key=lambda x: x[2],
        reverse=True
    )

    if len(ranking) > 0:

        df_ranking = pd.DataFrame(
            ranking,
            columns=[
                "Empleado",
                "Objetivos",
                "Índice Traza"
            ]
        )

        st.dataframe(
            df_ranking,
            use_container_width=True
        )

    else:

        st.info(
            "Todavía no hay datos para construir el ranking."
        )

    st.divider()

    # =========================
    # ÚLTIMOS OBJETIVOS
    # =========================

    st.subheader(
        "📋 Últimos Objetivos"
    )

    cursor.execute(
        """
        SELECT
        empleado,
        titulo,
        estado,
        validacion
        FROM objetivos
        ORDER BY id DESC
        LIMIT 10
        """
    )

    ultimos = cursor.fetchall()

    if len(ultimos) > 0:

        df_ultimos = pd.DataFrame(
            ultimos,
            columns=[
                "Empleado",
                "Objetivo",
                "Estado",
                "Validación"
            ]
        )

        st.dataframe(
            df_ultimos,
            use_container_width=True
        )

    else:

        st.info(
            "Todavía no hay objetivos recientes."
        )

elif pagina == "Perfil Profesional":

    st.title("👤 Perfil Profesional")

    cursor.execute(
        """
        SELECT DISTINCT empleado
        FROM objetivos
        """
    )

    empleados = [fila[0] for fila in cursor.fetchall()]

    if len(empleados) == 0:

        st.warning(
            "No hay empleados registrados."
        )

    else:

        if st.session_state.rol == "admin":

            empleado = st.selectbox(
                "Seleccionar empleado",
                empleados
            )

        else:

            empleado = st.session_state.persona

            st.info(
                f"Perfil: {empleado}"
            )

        # Objetivos totales

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            """,
            (empleado,)
        )

        total = cursor.fetchone()[0]

        # Objetivos completados

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            AND estado = 'Completado'
            """,
            (empleado,)
        )

        completados = cursor.fetchone()[0]

        # Validaciones positivas

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            AND validacion = 'De acuerdo'
            """,
            (empleado,)
        )

        positivos = cursor.fetchone()[0]

        # Validaciones parciales

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            AND validacion = 'Parcialmente de acuerdo'
            """,
            (empleado,)
        )

        parciales = cursor.fetchone()[0]

        # Validaciones negativas

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            AND validacion = 'En desacuerdo'
            """,
            (empleado,)
        )

        negativos = cursor.fetchone()[0]

        cumplimiento = 0

        if total > 0:

            cumplimiento = round(
                (completados / total) * 100,
                1
            )

        # Índice Traza normalizado sobre 100

        puntos = (
            completados * 10
            + positivos * 10
            + parciales * 5
            - negativos * 10
        )

        max_puntos = total * 20

        score = 0

        if max_puntos > 0:

            score = round(
                (puntos / max_puntos) * 100,
                1
            )

        if score < 0:
            score = 0

        if score > 100:
            score = 100

        # KPIs

        col1, col2, col3 = st.columns(3)

        with col1:
            st.metric(
                "Objetivos",
                total
            )

        with col2:
            st.metric(
                "Completados",
                completados
            )

        with col3:
            st.metric(
                "Cumplimiento",
                f"{cumplimiento}%"
            )

        st.divider()

        col4, col5, col6 = st.columns(3)

        with col4:
            st.metric(
                "Validaciones positivas",
                positivos
            )

        with col5:
            st.metric(
                "Parciales",
                parciales
            )

        with col6:
            st.metric(
                "Negativas",
                negativos
            )

        st.divider()

        st.markdown("## 🏆 Índice Traza")

        st.metric(
            "Índice Traza",
            f"{score}/100"
        )

        st.progress(
            score / 100
        )

        st.caption(
            "Indicador consolidado de cumplimiento y validación."
        )

        if score >= 90:

            st.success(
                "Desempeño sobresaliente."
            )

        elif score >= 75:

            st.info(
                "Desempeño sólido y consistente."
            )

        elif score >= 50:

            st.warning(
                "Hay oportunidades de mejora."
            )

        else:

            st.error(
                "Nivel de desempeño bajo."
            )

        st.divider()

        st.subheader(
            "💬 Últimas validaciones recibidas"
        )

        cursor.execute(
            """
            SELECT
            titulo,
            validacion,
            comentario_supervisor,
            evidencia
            FROM objetivos
            WHERE empleado = ?
            AND comentario_supervisor IS NOT NULL
            ORDER BY id DESC
            LIMIT 5
            """,
            (empleado,)
        )

        comentarios = cursor.fetchall()

        if len(comentarios) == 0:

            st.info(
                "Todavía no hay comentarios del supervisor."
            )

        else:

            for titulo, validacion, comentario, evidencia in comentarios:

                st.markdown(
    f"""
    **{titulo}**

    Validación: {validacion}

    _{comentario}_

    Evidencia: {evidencia}
    """
)

                st.divider()
elif pagina == "Reportes":

    st.title("📄 Reportes")

    st.caption(
        "Exportá información de desempeño para análisis externo."
    )

    cursor.execute(
        """
        SELECT
empleado,
titulo,
descripcion,
prioridad,
fecha_limite,
estado,
validacion,
comentario_supervisor,
evidencia
FROM objetivos
        """
    )

    datos = cursor.fetchall()

    if len(datos) == 0:

        st.warning(
            "Todavía no hay información para exportar."
        )

    else:

        df_reportes = pd.DataFrame(
            datos,
            columns=[
                "Empleado",
                "Objetivo",
                "Descripción",
                "Prioridad",
                "Fecha límite",
                "Estado",
                "Validación",
                "Comentario supervisor",
                "Evidencia"
            ]
        )

        st.dataframe(
            df_reportes,
            use_container_width=True
        )

        csv = df_reportes.to_csv(
            index=False
        ).encode("utf-8")

        st.download_button(
            label="⬇️ Descargar reporte CSV",
            data=csv,
            file_name="reporte_traza.csv",
            mime="text/csv"
        )

elif pagina == "🏆 Talent Card":

    st.title("🏆 Talent Card")

    st.caption(
        "Ficha ejecutiva del colaborador basada en desempeño, validaciones y evidencias."
    )

    cursor.execute(
        """
        SELECT
        nombre,
        apellido,
        cargo,
        area
        FROM personas
        """
    )

    personas = cursor.fetchall()

    if len(personas) == 0:

        st.warning(
            "No hay personas registradas."
        )

    else:

        opciones = {
            f"{nombre} {apellido}": (
                nombre,
                apellido,
                cargo,
                area
            )
            for nombre, apellido, cargo, area in personas
        }

        persona_seleccionada = st.selectbox(
            "Seleccionar colaborador",
            list(opciones.keys())
        )

        nombre, apellido, cargo, area = opciones[
            persona_seleccionada
        ]

        empleado = f"{nombre} {apellido}"

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            """,
            (empleado,)
        )

        total = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            AND estado = 'Completado'
            """,
            (empleado,)
        )

        completados = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            AND validacion = 'De acuerdo'
            """,
            (empleado,)
        )

        positivos = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            AND validacion = 'Parcialmente de acuerdo'
            """,
            (empleado,)
        )

        parciales = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM objetivos
            WHERE empleado = ?
            AND validacion = 'En desacuerdo'
            """,
            (empleado,)
        )

        negativos = cursor.fetchone()[0]

        cumplimiento = 0

        if total > 0:

            cumplimiento = round(
                completados / total * 100,
                1
            )

        puntos = (
            completados * 10
            + positivos * 10
            + parciales * 5
            - negativos * 10
        )

        max_puntos = total * 20

        indice = 0

        if max_puntos > 0:

            indice = round(
                puntos / max_puntos * 100,
                1
            )

        if indice < 0:
            indice = 0

        if indice > 100:
            indice = 100

        if indice >= 85:

            nivel = "Elite"
            mensaje_nivel = "Desempeño destacado y altamente validado."

        elif indice >= 65:

            nivel = "Avanzado"
            mensaje_nivel = "Desempeño sólido con buen nivel de avance."

        elif indice >= 40:

            nivel = "Profesional"
            mensaje_nivel = "Desempeño en desarrollo con oportunidades de mejora."

        else:

            nivel = "Inicial"
            mensaje_nivel = "Historial aún en construcción."

        st.markdown(
            f"""
            <div style="
                background: linear-gradient(135deg, #F8FAFC 0%, #EEF2F7 100%);
                border:1px solid #E5E7EB;
                border-radius:22px;
                padding:34px;
                margin-top:12px;
                margin-bottom:22px;
            ">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <p style="font-size:14px; color:#64748B; margin-bottom:6px;">
                            TALENT CARD
                        </p>
                        <h1 style="margin:0; color:#0F4C81;">
                            {empleado}
                        </h1>
                        <h3 style="margin-top:8px; color:#1F2937;">
                            {cargo}
                        </h3>
                        <p style="font-size:16px; color:#4B5563;">
                            {area}
                        </p>
                    </div>
                    <div style="
                        background-color:white;
                        border:1px solid #E5E7EB;
                        border-radius:16px;
                        padding:18px;
                        min-width:180px;
                        text-align:center;
                    ">
                        <p style="margin:0; color:#64748B;">
                            Índice Traza
                        </p>
                        <h1 style="margin:6px 0; color:#0F4C81;">
                            {indice}/100
                        </h1>
                        <strong>Nivel {nivel}</strong>
                    </div>
                </div>
                <hr>
                <p style="font-size:16px; color:#374151;">
                    {mensaje_nivel}
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

        st.progress(
            indice / 100
        )

        if indice >= 85:

            st.success(
                "💪 Fortaleza principal: ejecución consistente y resultados validados."
            )

        elif indice >= 65:

            st.info(
                "💪 Fortaleza principal: cumplimiento sostenido de objetivos."
            )

        elif indice >= 40:

            st.warning(
                "💪 Fortaleza principal: potencial de desarrollo identificado."
            )

        else:

            st.error(
                "💪 Requiere acompañamiento y seguimiento."
            )

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric(
                "🎯 Objetivos",
                total
            )

        with col2:
            st.metric(
                "✅ Completados",
                completados
            )

        with col3:
            st.metric(
                "📈 Cumplimiento",
                f"{cumplimiento}%"
            )

        with col4:
            st.metric(
                "⭐ Validaciones +",
                positivos
            )

        st.divider()

        st.subheader(
            "🏅 Logros destacados"
        )

        cursor.execute(
            """
            SELECT titulo
            FROM objetivos
            WHERE empleado = ?
            AND estado = 'Completado'
            LIMIT 5
            """,
            (empleado,)
        )

        logros = cursor.fetchall()

        if len(logros) == 0:

            st.info(
                "Todavía no hay logros registrados."
            )

        else:

            for logro in logros:

                st.success(
                    f"✅ {logro[0]}"
                )

        st.divider()

        st.subheader(
            "📎 Evidencias recientes"
        )

        cursor.execute(
            """
            SELECT titulo, evidencia
            FROM objetivos
            WHERE empleado = ?
            AND evidencia IS NOT NULL
            AND evidencia <> ''
            LIMIT 5
            """,
            (empleado,)
        )

        evidencias = cursor.fetchall()

        if len(evidencias) == 0:

            st.info(
                "Todavía no hay evidencias registradas."
            )

        else:

            for titulo_evidencia, link_evidencia in evidencias:

                st.markdown(
                    f"**{titulo_evidencia}** — [📎 Ver evidencia]({link_evidencia})"
                )

        st.divider()

        st.subheader(
            "💬 Último feedback"
        )

        cursor.execute(
            """
            SELECT comentario_supervisor
            FROM objetivos
            WHERE empleado = ?
            AND comentario_supervisor IS NOT NULL
            AND comentario_supervisor <> ''
            ORDER BY id DESC
            LIMIT 1
            """,
            (empleado,)
        )

        feedback = cursor.fetchone()

        if feedback:

            st.info(
                feedback[0]
            )

        else:

            st.info(
                "Todavía no hay feedback registrado."
            )

elif pagina == "Guía":

    st.title("🧭 Guía de uso")

    st.write(
        """
        Traza permite construir un historial verificable de desempeño profesional
        a partir de objetivos, resultados y validaciones.
        """
    )

    st.divider()

    st.subheader("1. Crear personas")

    st.write(
        """
        Primero se registran los colaboradores de la organización.
        Cada persona puede tener un cargo, área y supervisor asignado.
        """
    )

    st.subheader("2. Cargar objetivos")

    st.write(
        """
        Luego, cada colaborador carga sus objetivos dentro del Plan de Trabajo.
        Estos objetivos incluyen descripción, prioridad, fecha límite y estado.
        """
    )

    st.subheader("3. Validar resultados")

    st.write(
        """
        El supervisor revisa los objetivos y valida si está de acuerdo,
        parcialmente de acuerdo o en desacuerdo con el resultado informado.
        """
    )

    st.subheader("4. Analizar desempeño")

    st.write(
        """
        Analytics consolida la información y muestra cumplimiento,
        ranking, distribución de estados, validaciones y Top Performer.
        """
    )

    st.subheader("5. Construir perfil profesional")

    st.write(
        """
        El Perfil Profesional muestra el Índice Traza de cada colaborador,
        construido a partir del cumplimiento y la validación de resultados.
        """
    )

    st.success(
        "Objetivo final: transformar trabajo realizado en evidencia profesional verificable."
    )        

    st.divider()

st.caption(
    "Traza © 2026 • Professional Performance Intelligence Platform"
)