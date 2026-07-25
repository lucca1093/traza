-- Billing columns en tabla empresas (MercadoPago)
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS plan              text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS mp_payment_id     text,
  ADD COLUMN IF NOT EXISTS mp_payer_email    text,
  ADD COLUMN IF NOT EXISTS plan_activo_hasta timestamptz,
  ADD COLUMN IF NOT EXISTS plan_seats        integer DEFAULT 1;
