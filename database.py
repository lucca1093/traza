import sqlite3

conn = sqlite3.connect("performance.db")

cursor = conn.cursor()

# =========================
# TABLA OBJETIVOS
# =========================

cursor.execute("""
CREATE TABLE IF NOT EXISTS objetivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado TEXT,
    titulo TEXT,
    descripcion TEXT,
    prioridad TEXT,
    fecha_limite TEXT,
    estado TEXT,
    validacion TEXT,
    comentario_supervisor TEXT
)
""")

# Agregar columna evidencia si todavía no existe

try:
    cursor.execute("""
    ALTER TABLE objetivos
    ADD COLUMN evidencia TEXT
    """)
except sqlite3.OperationalError:
    pass

# =========================
# TABLA PERSONAS
# =========================

cursor.execute("""
CREATE TABLE IF NOT EXISTS personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    apellido TEXT,
    cargo TEXT,
    area TEXT,
    supervisor TEXT
)
""")

conn.commit()

conn.close()

print("Base actualizada correctamente")