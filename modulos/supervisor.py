import streamlit as st
import sqlite3

def render():

    conn = sqlite3.connect("performance.db")

    cursor = conn.cursor()

    st.title("👨‍💼 Supervisor")

    cursor.execute(
        """
        SELECT
        id,
        empleado,
        titulo,
        estado
        FROM objetivos
        """
    )

    objetivos = cursor.fetchall()

    if len(objetivos) == 0:

        st.info("No hay objetivos registrados")

        return

    seleccion = st.selectbox(
        "Seleccionar objetivo",
        objetivos
    )

    validacion = st.selectbox(
        "Validación",
        [
            "De acuerdo",
            "Parcialmente de acuerdo",
            "En desacuerdo"
        ]
    )

    comentario = st.text_area("Comentario")

    if st.button("Guardar validación"):

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

        st.success("Validación guardada")