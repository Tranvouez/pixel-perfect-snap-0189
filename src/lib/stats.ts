// Logique de calcul PURE (aucun accès base). Utilisable côté serveur et côté admin.
// Règle : pourcentage = bonnes réponses / réponses données (jamais / nombre total de secrets).

export const FAUX = "__faux__";

export type SecretLite = {
  id: string;
  est_faux: boolean;
  proprietaire_nom: string | null;
};
export type ReponseLite = {
  joueur_id: string;
  secret_id: string;
  choix_joueur_id: string | null;
  choix_faux: boolean;
};
export type JoueurLite = {
  id: string;
  pseudo: string;
};

const cleNom = (s: string) => s.trim().toLocaleLowerCase("fr");

export function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

export function estJuste(s: SecretLite, r: ReponseLite, joueurs: JoueurLite[]) {
  if (s.est_faux) return r.choix_faux;
  if (!s.proprietaire_nom?.trim() || r.choix_faux || !r.choix_joueur_id) return false;
  const choisi = joueurs.find((j) => j.id === r.choix_joueur_id);
  return !!choisi && cleNom(choisi.pseudo) === cleNom(s.proprietaire_nom);
}

/** Stats d'un secret : réponses reçues, bonnes réponses, % = bonnes / réponses. */
export function statsSecret(s: SecretLite, reps: ReponseLite[], joueurs: JoueurLite[]) {
  const liste = reps.filter((r) => r.secret_id === s.id);
  const justes = liste.filter((r) => estJuste(s, r, joueurs)).length;
  return { reponses: liste.length, justes, pourcentage: pct(justes, liste.length) };
}

/** Stats d'un joueur sur un ensemble de secrets (un pool). */
export function statsJoueurPool(
  joueurId: string,
  secrets: SecretLite[],
  reps: ReponseLite[],
  joueurs: JoueurLite[],
) {
  let repondus = 0;
  let justes = 0;
  for (const s of secrets) {
    const r = reps.find((x) => x.joueur_id === joueurId && x.secret_id === s.id);
    if (!r) continue;
    repondus += 1;
    if (estJuste(s, r, joueurs)) justes += 1;
  }
  return {
    repondus,
    total: secrets.length,
    justes,
    remplissage: pct(repondus, secrets.length),
    pourcentage: pct(justes, repondus),
  };
}
