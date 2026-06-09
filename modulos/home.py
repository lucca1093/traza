import streamlit as st

def render():

    st.title("🏠 Inicio")

    st.write("Bienvenido a Performance App")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Objetivos activos", "0")

    with col2:
        st.metric("Completados", "0")

    with col3:
        st.metric("Cumplimiento", "0%")