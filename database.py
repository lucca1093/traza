import sqlite3

conn = sqlite3.connect("performance.db")

cursor = conn.cursor()

# =========================
# TABLA EMPRESAS
# =========================

cursor.execute("""
CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    rubro TEXT
)
""")

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

try:
    cursor.execute("""
    ALTER TABLE objetivos
    ADD COLUMN evidencia TEXT
    """)
except sqlite3.OperationalError:
    pass

try:
    cursor.execute("""
    ALTER TABLE objetivos
    ADD COLUMN empresa TEXT
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

try:
    cursor.execute("""
    ALTER TABLE personas
    ADD COLUMN empresa TEXT
    """)
except sqlite3.OperationalError:
    pass

conn.commit()

cursor.execute(
    """
    UPDATE objetivos
    SET empresa = (
        SELECT personas.empresa
        FROM personas
        WHERE objetivos.empleado = personas.nombre || ' ' || personas.apellido
    )
    WHERE empresa IS NULL
    OR empresa = ''
    """
)

conn.commit()

try:
    cursor.execute("""
    ALTER TABLE objetivos
    ADD COLUMN tipo_objetivo TEXT
    """)
except sqlite3.OperationalError:
    pass

cursor.execute(
    """
    UPDATE objetivos
    SET tipo_objetivo = 'Personal'
    WHERE tipo_objetivo IS NULL
    OR tipo_objetivo = ''
    """
)

conn.close()

print("Base actualizada correctamente")