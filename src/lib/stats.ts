// Logique de calcul PURE (aucun accès base). Utilisable côté serveur et côté admin.
// Règle : pourcentage = bonnes réponses / réponses données (jamais / nombre total de secrets).

export const FAUX = "__faux__";

export type SecretLite = {
  id: string;
  est_faux: boolean;
  /** Nom saisi librement par l'admin : aucun lien avec les joueurs connectés. */
  proprietaire_nom: string | null;
};
export type ReponseLite = {
  joueur_id: string;
  secret_id: string;
  /** Nom choisi par le joueur parmi les personnes proposées. */
  choix_nom: string | null;
  choix_faux: boolean;
};

/** Clé de comparaison d'un nom : sans espaces superflus ni différence de casse. */
export function cleNom(n: string | null | undefined) {
  return (n ?? "").trim().toLocaleLowerCase("fr");
}

export function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

export function estJuste(s: SecretLite, r: ReponseLite) {
  if (s.est_faux) return r.choix_faux;
  return !!s.proprietaire_nom && !r.choix_faux && !!r.choix_nom && cleNom(r.choix_nom) === cleNom(s.proprietaire_nom);
}

/** Stats d'un secret : réponses reçues, bonnes réponses, % = bonnes / réponses. */
export function statsSecret(s: SecretLite, reps: ReponseLite[]) {
  const liste = reps.filter((r) => r.secret_id === s.id);
  const justes = liste.filter((r) => estJuste(s, r)).length;
  return { reponses: liste.length, justes, pourcentage: pct(justes, liste.length) };
}

/** Stats d'un joueur sur un ensemble de secrets (un pool). */
export function statsJoueurPool(joueurId: string, secrets: SecretLite[], reps: ReponseLite[]) {
  let repondus = 0;
  let justes = 0;
  for (const s of secrets) {
    const r = reps.find((x) => x.joueur_id === joueurId && x.secret_id === s.id);
    if (!r) continue;
    repondus += 1;
    if (estJuste(s, r)) justes += 1;
  }
  return {
    repondus,
    total: secrets.length,
    justes,
    remplissage: pct(repondus, secrets.length),
    pourcentage: pct(justes, repondus),
  };
}
