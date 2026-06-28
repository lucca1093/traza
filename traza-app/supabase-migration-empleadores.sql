-- ============================================================
-- TRAZA — Migration: vista de empleadores
-- Pegar en Supabase → SQL Editor → Run
-- ============================================================

-- 1. Agregar columna opt-in a personas
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS disponible_para_busqueda BOOLEAN DEFAULT false;

-- 2. Índice para queries de la vista pública
CREATE INDEX IF NOT EXISTS idx_personas_disponible
  ON personas(disponible_para_busqueda, empleo_activo)
  WHERE disponible_para_busqueda = true;
