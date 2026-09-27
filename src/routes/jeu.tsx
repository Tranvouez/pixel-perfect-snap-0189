import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { JOUEUR_COURANT, SOIREE, joueur, statsJoueur, team } from "@/lib/demo-data";
import { Screen, TopBar, Card, BottomNav, TeamDot } from "@/components/app-shell";

export const Route = createFileRoute("/jeu")({
  head: () => ({
    meta: [
      { title: "Mon écran — Secret Story Afterwork" },
      { name: "description", content: "Associez chaque secret à la bonne personne." },
      { property: "og:title", content: "À qui appartient ce secret ?" },
      { property: "og:description", content: "Associez les secrets aux joueurs du pool actif." },
    ],
  }),
  component: EcranJoueur,
});

function EcranJoueur() {
  const pool = SOIREE.pools.find((p) => p.statut === "en_cours")!;
  const aDeviner = pool.secrets.filter((s) => !s.revele);
  const [index, setIndex] = useState(0);
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [valide, setValide] = useState(false);
  const secret = aDeviner[index]!;
  const moi = joueur(JOUEUR_COURANT)!;
  const stats = statsJoueur(JOUEUR_COURANT);

  return (
    <Screen className="flex flex-col">
      <TopBar titre={pool.nom} retour="/" />
      <div className="flex-1 space-y-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamDot couleur={team(moi.teamId)!.couleur} />
            <span className="text-xs text-muted-foreground">
              {moi.pseudo} · {team(moi.teamId)?.nom}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Secret {index + 1} / {aDeviner.length}
          </span>
        </div>

        {valide ? (
          <Card className="glow-top py-10 text-center">
            <p className="font-display text-xl">Réponses envoyées</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Vos réponses sont scellées. Attendez que l'animateur lance la révélation.
            </p>
            <span className="mt-4 inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-primary">
              En attente
            </span>
          </Card>
        ) : (
          <>
            <Card>
              <p className="eyebrow">À qui appartient ce secret ?</p>
              <p className="mt-2 font-display text-lg leading-snug">« {secret.texte} »</p>
            </Card>

            <div className="space-y-2">
              {pool.joueurIds
                .filter((id) => id !== JOUEUR_COURANT)
                .map((id) => {
                  const j = joueur(id)!;
                  const actif = choix[secret.id] === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setChoix({ ...choix, [secret.id]: id })}
                      className={`flex h-14 w-full items-center gap-3 rounded-xl border px-3 text-left ${
                        actif ? "border-primary bg-primary/10" : "border-border bg-surface"
                      }`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-sm">
                        {j.pseudo[0]}
                      </span>
                      <span className="text-sm font-medium">{j.pseudo}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {team(j.teamId)?.nom}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="h-13 flex-1 rounded-xl border border-border bg-surface text-sm disabled:opacity-40"
              >
                Précédent
              </button>
              {index < aDeviner.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  className="h-13 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setValide(true)}
                  className="h-13 flex-1 rounded-xl bg-accent text-sm font-semibold text-accent-foreground"
                >
                  Valider mes réponses
                </button>
              )}
            </div>
          </>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2">
          <Card className="py-3 text-center">
            <p className="font-display text-xl">{stats.repondus}</p>
            <p className="eyebrow mt-1">Joués</p>
          </Card>
          <Card className="py-3 text-center">
            <p className="font-display text-xl text-success">{stats.justes}</p>
            <p className="eyebrow mt-1">Trouvés</p>
          </Card>
          <Card className="py-3 text-center">
            <p className="font-display text-xl text-primary">{stats.pourcentage}%</p>
            <p className="eyebrow mt-1">Réussite</p>
          </Card>
        </div>
      </div>
      <BottomNav actif="jeu" />
    </Screen>
  );
}
