import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { JOUEUR_COURANT, SOIREE, joueur, statsJoueur } from "@/lib/demo-data";
import { Screen, TopBar, Card, BottomNav } from "@/components/app-shell";

export const Route = createFileRoute("/jeu")({
  head: () => ({
    meta: [
      { title: "Mon écran — Secret Story Afterwork" },
      { name: "description", content: "Associez chaque secret à la bonne personne." },
      { property: "og:title", content: "À qui appartient ce secret ?" },
      { property: "og:description", content: "Tous les secrets et tous les participants du pool sur un seul écran." },
    ],
  }),
  component: EcranJoueur,
});

function EcranJoueur() {
  const pool = SOIREE.pools.find((p) => p.statut === "en_cours")!;
  const aDeviner = pool.secrets.filter((s) => !s.revele);
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [valide, setValide] = useState(false);
  const [ouvert, setOuvert] = useState<string | null>(aDeviner[0]?.id ?? null);
  const moi = joueur(JOUEUR_COURANT)!;
  const stats = statsJoueur(JOUEUR_COURANT);
  const participants = pool.joueurIds.map((id) => joueur(id)!).filter((j) => j.id !== JOUEUR_COURANT);
  const nbRep = Object.keys(choix).length;

  return (
    <Screen className="flex flex-col">
      <TopBar titre={pool.nom} retour="/" />
      <div className="flex-1 space-y-4 px-5 py-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {moi.pseudo}
            {moi.nbParticipants > 1 && ` · ${moi.nbParticipants} joueurs`}
          </span>
          <span>
            {nbRep} / {aDeviner.length} associés
          </span>
        </div>

        {valide ? (
          <Card className="glow-top neon py-10 text-center">
            <p className="font-display text-xl text-neon">Réponses envoyées</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Vos réponses sont scellées. Attendez que l'animateur lance la révélation.
            </p>
            <span className="mt-4 inline-block rounded-full border border-accent/50 bg-accent/15 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-accent">
              En attente
            </span>
          </Card>
        ) : (
          <>
            <Card>
              <p className="eyebrow">Les participants du pool</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {participants.map((j) => (
                  <span key={j.id} className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium">
                    {j.pseudo}
                  </span>
                ))}
              </div>
            </Card>

            <p className="eyebrow pt-1">Les secrets · touchez-en un pour l'associer</p>
            <div className="space-y-2">
              {aDeviner.map((s, i) => {
                const choisi = joueur(choix[s.id]);
                const estOuvert = ouvert === s.id;
                return (
                  <div
                    key={s.id}
                    className={`rounded-2xl border bg-card p-4 transition ${
                      estOuvert ? "neon border-primary" : choisi ? "border-primary/40" : "border-border"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOuvert(estOuvert ? null : s.id)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <span className="font-display text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 text-sm leading-snug">« {s.texte} »</span>
                    </button>
                    <div className="mt-2 pl-7 text-xs">
                      {choisi ? (
                        <span className="rounded-full bg-neon-gradient px-2.5 py-1 font-semibold text-primary-foreground">
                          → {choisi.pseudo}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pas encore associé</span>
                      )}
                    </div>
                    {estOuvert && (
                      <div className="mt-3 flex flex-wrap gap-2 pl-7">
                        {participants.map((j) => {
                          const actif = choix[s.id] === j.id;
                          return (
                            <button
                              key={j.id}
                              type="button"
                              onClick={() => {
                                setChoix({ ...choix, [s.id]: j.id });
                                const suivant = aDeviner.find((x) => x.id !== s.id && !choix[x.id]);
                                setOuvert(suivant?.id ?? null);
                              }}
                              className={`h-10 rounded-full border px-4 text-sm ${
                                actif ? "border-primary bg-primary/20 text-foreground" : "border-border bg-surface"
                              }`}
                            >
                              {j.pseudo}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={nbRep < aDeviner.length}
              onClick={() => setValide(true)}
              className="neon h-14 w-full rounded-xl bg-neon-gradient font-display text-sm text-primary-foreground disabled:opacity-40 disabled:shadow-none"
            >
              Valider mes réponses
            </button>
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
