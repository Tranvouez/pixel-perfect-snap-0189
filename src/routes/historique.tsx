import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SOIREE, joueur, statsSecret } from "@/lib/demo-data";
import { Screen, TopBar, Card, BottomNav } from "@/components/app-shell";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique — Secret Story Afterwork" },
      { name: "description", content: "Tous les secrets révélés, pool par pool." },
      { property: "og:title", content: "Historique de la soirée" },
      { property: "og:description", content: "Revoyez chaque secret, son propriétaire et le score." },
    ],
  }),
  component: Historique,
});

function Historique() {
  const [poolId, setPoolId] = useState(SOIREE.pools[0]!.id);
  const pool = SOIREE.pools.find((p) => p.id === poolId)!;
  const reveles = pool.secrets.filter((s) => s.revele);

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Historique" retour="/" />
      <div className="flex-1 space-y-4 px-5 py-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SOIREE.pools.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPoolId(p.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium ${
                poolId === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              {p.nom}
            </button>
          ))}
        </div>

        {reveles.length === 0 && (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            Aucun secret révélé dans ce pool pour l'instant.
          </Card>
        )}

        {reveles.map((s) => {
          const st = statsSecret(s);
          const prop = joueur(s.proprietaireId);
          return (
            <Card key={s.id}>
              <p className="text-sm leading-snug">« {s.texte} »</p>
              <div className="mt-3 flex items-center gap-2">
                {prop ? (
                  <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] text-success">
                    {prop.pseudo}
                  </span>
                ) : (
                  <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] text-accent">
                    Faux secret
                  </span>
                )}
                <span className="ml-auto font-display text-sm text-primary">
                  {st.pourcentage}%
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${st.pourcentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {st.justes} bonne{st.justes > 1 ? "s" : ""} réponse{st.justes > 1 ? "s" : ""} sur{" "}
                {st.total} joueurs
              </p>
            </Card>
          );
        })}
      </div>
      <BottomNav actif="historique" />
    </Screen>
  );
}
