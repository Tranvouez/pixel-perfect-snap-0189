ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS invite boolean NOT NULL DEFAULT false;
ALTER TABLE public.secrets ADD COLUMN IF NOT EXISTS proprietaire_nom text;
COMMENT ON COLUMN public.secrets.proprietaire_id IS 'DEPRECATED: replaced by proprietaire_nom (nom libre saisi par l''admin)';