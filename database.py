import sqlite3

conn = sqlite3.connect("performance.db")

cursor = conn.cursor()

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

conn.commit()

print("Base creada correctamente")

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