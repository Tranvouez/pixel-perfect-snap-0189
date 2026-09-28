CREATE TABLE public.soirees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  code text NOT NULL UNIQUE,
  lieu text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.joueurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soiree_id uuid NOT NULL REFERENCES public.soirees(id) ON DELETE CASCADE,
  pseudo text NOT NULL,
  nb_participants int NOT NULL DEFAULT 1,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soiree_id uuid NOT NULL REFERENCES public.soirees(id) ON DELETE CASCADE,
  nom text NOT NULL,
  ordre int NOT NULL DEFAULT 0,
  accessible boolean NOT NULL DEFAULT false,
  reponses_visibles boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (soiree_id, nom)
);
CREATE TABLE public.secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soiree_id uuid NOT NULL REFERENCES public.soirees(id) ON DELETE CASCADE,
  pool_id uuid REFERENCES public.pools(id) ON DELETE SET NULL,
  texte text NOT NULL,
  est_faux boolean NOT NULL DEFAULT false,
  proprietaire_id uuid REFERENCES public.joueurs(id) ON DELETE SET NULL,
  ordre int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (soiree_id, texte)
);
CREATE TABLE public.reponses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  joueur_id uuid NOT NULL REFERENCES public.joueurs(id) ON DELETE CASCADE,
  secret_id uuid NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  choix_joueur_id uuid REFERENCES public.joueurs(id) ON DELETE CASCADE,
  choix_faux boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (joueur_id, secret_id)
);
CREATE TABLE public.soiree_sync (
  soiree_id uuid PRIMARY KEY REFERENCES public.soirees(id) ON DELETE CASCADE,
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.soirees, public.joueurs, public.pools, public.secrets, public.reponses, public.soiree_sync TO service_role;
GRANT SELECT ON public.soiree_sync TO anon, authenticated;

ALTER TABLE public.soirees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.joueurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soiree_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync lisible" ON public.soiree_sync FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.bump_sync() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid;
BEGIN
  IF TG_TABLE_NAME = 'soirees' THEN
    sid := COALESCE(NEW.id, OLD.id);
    IF TG_OP = 'INSERT' THEN
      INSERT INTO soiree_sync(soiree_id) VALUES (sid) ON CONFLICT DO NOTHING;
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'reponses' THEN
    SELECT soiree_id INTO sid FROM joueurs WHERE id = COALESCE(NEW.joueur_id, OLD.joueur_id);
  ELSE
    sid := COALESCE(NEW.soiree_id, OLD.soiree_id);
  END IF;
  IF sid IS NOT NULL THEN
    UPDATE soiree_sync SET version = version + 1, updated_at = now() WHERE soiree_id = sid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
REVOKE EXECUTE ON FUNCTION public.bump_sync() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER t_sync_soirees AFTER INSERT OR UPDATE ON public.soirees FOR EACH ROW EXECUTE FUNCTION public.bump_sync();
CREATE TRIGGER t_sync_joueurs AFTER INSERT OR DELETE OR UPDATE OF pseudo, nb_participants ON public.joueurs FOR EACH ROW EXECUTE FUNCTION public.bump_sync();
CREATE TRIGGER t_sync_pools AFTER INSERT OR UPDATE OR DELETE ON public.pools FOR EACH ROW EXECUTE FUNCTION public.bump_sync();
CREATE TRIGGER t_sync_secrets AFTER INSERT OR UPDATE OR DELETE ON public.secrets FOR EACH ROW EXECUTE FUNCTION public.bump_sync();
CREATE TRIGGER t_sync_reponses AFTER INSERT OR UPDATE OR DELETE ON public.reponses FOR EACH ROW EXECUTE FUNCTION public.bump_sync();

ALTER PUBLICATION supabase_realtime ADD TABLE public.soiree_sync;

INSERT INTO public.soirees (nom, code, lieu) VALUES ('Secret story de rentrée', '2007', 'La maison des secrets');