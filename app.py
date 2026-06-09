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
            "Reportes",
            "Guía"
        ],
        "empleado": [
            "Inicio",
            "Plan de Trabajo",
            "Perfil Profesional",
            "Guía"
        ],
        "supervisor": [
            "Inicio",
            "Validación",
            "Analytics",
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

h1 {
    color: #0F4C81;
    font-weight: 700;
}

h2, h3 {
    color: #1F2937;
}

[data-testid="stSidebar"] {
    background-color: #F8FAFC;
}

div[data-testid="metric-container"] {
    border: 1px solid #E5E7EB;
    padding: 20px;
    border-radius: 12px;
    background-color: white;
}

.stAlert {
    border-radius: 12px;
}

</style>
""", unsafe_allow_html=True)

st.sidebar.markdown(
    """
    # 📈 TRAZA

    **Desempeño profesional verificable**
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
        "Reportes",
        "Guía"
    ]

elif rol == "empleado":

    opciones_menu = [
        "Inicio",
        "Plan de Trabajo",
        "Perfil Profesional",
        "Guía"
    ]

elif rol == "supervisor":

    opciones_menu = [
        "Inicio",
        "Validación",
        "Analytics",
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

    st.title("📈 TRAZA")

    st.subheader(
        "Desempeño profesional verificable"
    )

    st.write(
        """
        Centralizá objetivos, validaciones y evidencia de desempeño
        en una única plataforma.

        Traza transforma el trabajo realizado en información medible,
        validada y trazable para colaboradores, supervisores y organizaciones.
        """
    )

    st.divider()

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

    st.success(
        "Construí un historial profesional verificable basado en resultados y validaciones."
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
                    estado
                )
                VALUES
                (?, ?, ?, ?, ?, ?)
                """,
                (
                    empleado,
                    titulo,
                    descripcion,
                    prioridad,
                    str(fecha_limite),
                    estado
                )
            )

            conn.commit()

            st.success(
                "Objetivo guardado correctamente"
            )

        st.divider()

        st.subheader(
            "Objetivos registrados"
        )

        cursor.execute(
            """
            SELECT
            id,
            empleado,
            titulo,
            prioridad,
            fecha_limite,
            estado
            FROM objetivos
            """
        )

        datos = cursor.fetchall()

        st.table(datos)

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
        "Indicadores consolidados de desempeño y cumplimiento."
    )

    # KPIs

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

    col1, col2, col3, col4 = st.columns(4)

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

    # Top Performer

        # Top Performer normalizado

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

    top_raw = cursor.fetchall()

    top_empleado = None
    top_indice = 0

    for empleado, total_objetivos, puntos in top_raw:

        if puntos is None:
            puntos = 0

        max_puntos = total_objetivos * 20

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

    st.divider()

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

        st.divider()

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

    # Ranking

    # Ranking Traza

    st.subheader(
        "🏆 Ranking Traza"
    )

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

    ranking_raw = cursor.fetchall()

    ranking = []

    for empleado, total_objetivos, puntos in ranking_raw:

        if puntos is None:
            puntos = 0

        max_puntos = total_objetivos * 20

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
                total_objetivos,
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

    # Últimos objetivos

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

    st.table(
        ultimos
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
            comentario_supervisor
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
                "Comentario supervisor"
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