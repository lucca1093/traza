-- Agrega columna tamaño a la tabla empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS tamano text;
