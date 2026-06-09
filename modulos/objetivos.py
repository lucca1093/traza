import streamlit as st
import sqlite3

def render():

    conn = sqlite3.connect("performance.db")

    cursor = conn.cursor()

    st.title("🎯 Mis Objetivos")

    empleado = st.text_input("Empleado")

    titulo = st.text_input("Título")

    descripcion = st.text_area("Descripción")

    prioridad = st.selectbox(
        "Prioridad",
        ["Alta","Media","Baja"]
    )

    fecha = st.date_input("Fecha objetivo")

    if st.button("Guardar"):

        cursor.execute(
            """
            INSERT INTO objetivos
            (
                empleado,
                titulo,
                descripcion,
                prioridad,
                fecha_objetivo,
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
                str(fecha),
                "Pendiente"
            )
        )

        conn.commit()

        st.success("Objetivo guardado")