import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SOIREE, joueur, statsSecret, team } from "@/lib/demo-data";
import { Screen, TopBar, Card, BottomNav } from "@/components/app-shell";

export const Route = createFileRoute("/revelation")({
  head: () => ({
    meta: [
      { title: "Révélation — Secret Story Afterwork" },
      { name: "description", content: "Le vrai propriétaire du secret et le score de la table." },
      { property: "og:title", content: "La révélation" },
      { property: "og:description", content: "Vrai secret ou faux secret ? Le verdict tombe." },
    ],
  }),
  component: Revelation,
});

function Revelation() {
  const pool = SOIREE.pools.find((p) => p.statut === "en_cours")!;
  const [index, setIndex] = useState(1);
  const secret = pool.secrets[Math.min(index, pool.secrets.length - 1)]!;
  const st = statsSecret(secret);
  const prop = joueur(secret.proprietaireId);

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Révélation" retour="/jeu" />
      <div className="glow-top flex-1 px-5 py-6">
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-accent">
          {pool.nom} · secret {index + 1} / {pool.secrets.length}
        </p>

        <Card key={secret.id} className="animate-reveal mt-6 border-accent/40 text-center">
          <span
            className={`inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${
              prop ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
            }`}
          >
            {prop ? "Secret authentique" : "Faux secret"}
          </span>
          <p className="mt-4 font-display text-3xl leading-none">
            {prop ? prop.pseudo : "Personne"}
          </p>
          {prop && (
            <p className="mt-1 text-xs text-muted-foreground">{team(prop.teamId)?.nom}</p>
          )}
          <p className="mx-auto mt-4 max-w-[30ch] text-sm leading-snug text-muted-foreground">
            « {secret.texte} »
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="font-display text-2xl leading-none">
                {st.justes}
                <span className="text-base text-muted-foreground">/{st.total}</span>
              </p>
              <p className="eyebrow mt-2">Bonnes réponses</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="font-display text-2xl leading-none text-primary">{st.pourcentage}%</p>
              <p className="eyebrow mt-2">Taux de réussite</p>
            </div>
          </div>
        </Card>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="h-13 flex-1 rounded-xl border border-border bg-surface text-sm disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            type="button"
            disabled={index >= pool.secrets.length - 1}
            onClick={() => setIndex((i) => i + 1)}
            className="h-13 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Révéler le suivant
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Les joueurs attendent que l'animateur lance la révélation suivante.
        </p>
      </div>
      <BottomNav actif="revelation" />
    </Screen>
  );
}
