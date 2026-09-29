-- Les propriétaires de secrets sont des NOMS libres, indépendants des joueurs connectés.
-- Les joueurs désignent l'un de ces noms ; la correction compare les noms (sans tenir compte de la casse).
ALTER TABLE public.secrets  ADD COLUMN IF NOT EXISTS proprietaire_nom text;
ALTER TABLE public.reponses ADD COLUMN IF NOT EXISTS choix_nom text;

-- Reprise des données existantes (liens vers joueurs -> noms).
UPDATE public.secrets  s SET proprietaire_nom = j.pseudo FROM public.joueurs j
  WHERE s.proprietaire_id = j.id AND s.proprietaire_nom IS NULL;
UPDATE public.reponses r SET choix_nom = j.pseudo FROM public.joueurs j
  WHERE r.choix_joueur_id = j.id AND r.choix_nom IS NULL;

-- Nettoyage d'une éventuelle version précédente (participants « invités » rattachés aux joueurs).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'joueurs' AND column_name = 'invite') THEN
    DELETE FROM public.joueurs WHERE invite;
    ALTER TABLE public.joueurs DROP COLUMN invite;
  END IF;
END $$;

-- Cohérence : un faux secret n'a pas de propriétaire ; une réponse est un nom OU "faux secret".
UPDATE public.secrets SET proprietaire_nom = NULL WHERE est_faux;
ALTER TABLE public.secrets DROP CONSTRAINT IF EXISTS secrets_faux_sans_nom;
ALTER TABLE public.secrets
  ADD CONSTRAINT secrets_faux_sans_nom CHECK (NOT est_faux OR proprietaire_nom IS NULL);
ALTER TABLE public.reponses DROP CONSTRAINT IF EXISTS reponses_nom_coherent;
ALTER TABLE public.reponses
  ADD CONSTRAINT reponses_nom_coherent CHECK (NOT (choix_faux AND choix_nom IS NOT NULL));
