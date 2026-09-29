-- Cohérence des données : un secret appartient à UN pool de SA soirée,
-- un vrai secret a un propriétaire de la même soirée, un faux secret n'en a pas.
CREATE OR REPLACE FUNCTION public.check_secret_coherence() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.pool_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pools WHERE id = NEW.pool_id AND soiree_id = NEW.soiree_id
  ) THEN
    RAISE EXCEPTION 'Le pool n''appartient pas à la soirée du secret';
  END IF;
  IF NEW.proprietaire_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM joueurs WHERE id = NEW.proprietaire_id AND soiree_id = NEW.soiree_id
  ) THEN
    RAISE EXCEPTION 'Le propriétaire n''appartient pas à la soirée du secret';
  END IF;
  IF NEW.est_faux AND NEW.proprietaire_id IS NOT NULL THEN
    RAISE EXCEPTION 'Un faux secret ne peut pas avoir de propriétaire';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS t_secret_coherence ON public.secrets;
CREATE TRIGGER t_secret_coherence
  BEFORE INSERT OR UPDATE OF pool_id, proprietaire_id, est_faux, soiree_id ON public.secrets
  FOR EACH ROW EXECUTE FUNCTION public.check_secret_coherence();

-- Une réponse est soit "un joueur", soit "faux secret", jamais les deux.
ALTER TABLE public.reponses DROP CONSTRAINT IF EXISTS reponses_choix_coherent;
ALTER TABLE public.reponses
  ADD CONSTRAINT reponses_choix_coherent CHECK (NOT (choix_faux AND choix_joueur_id IS NOT NULL));

-- Des révélations ne peuvent être disponibles que sur un pool accessible.
UPDATE public.pools SET reponses_visibles = false WHERE reponses_visibles AND NOT accessible;
ALTER TABLE public.pools DROP CONSTRAINT IF EXISTS pools_reponses_need_access;
ALTER TABLE public.pools
  ADD CONSTRAINT pools_reponses_need_access CHECK (NOT reponses_visibles OR accessible);

CREATE INDEX IF NOT EXISTS secrets_pool_idx ON public.secrets (pool_id);
CREATE INDEX IF NOT EXISTS reponses_secret_idx ON public.reponses (secret_id);
