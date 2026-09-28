-- Participants « invités » : noms saisis par l'admin (propriétaires de secrets) qui n'ont pas
-- de téléphone connecté. Ils apparaissent dans la liste de choix des joueurs mais ne comptent
-- ni dans les joueurs, ni dans les taux de remplissage.
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS invite boolean NOT NULL DEFAULT false;
