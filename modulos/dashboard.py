import streamlit as st
import sqlite3

def render():

    conn = sqlite3.connect("performance.db")

    cursor = conn.cursor()

    st.title("📊 Dashboard")

    cursor.execute(
        "SELECT COUNT(*) FROM objetivos"
    )

    total = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM objetivos
        WHERE validacion='De acuerdo'
        """
    )

    aprobados = cursor.fetchone()[0]

    cumplimiento = 0

    if total > 0:
        cumplimiento = round(
            aprobados / total * 100,
            1
        )

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric(
            "Objetivos",
            total
        )

    with col2:
        st.metric(
            "Validados",
            aprobados
        )

    with col3:
        st.metric(
            "Cumplimiento",
            f"{cumplimiento}%"
        )
        