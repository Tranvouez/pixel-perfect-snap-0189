import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Screen, TopBar, Card, BottomNav } from "@/components/app-shell";
import { AucunPool, Chargement, PoolSelect } from "@/components/pool-select";
import { useJoueur } from "@/hooks/use-joueur";
import { historiqueJoueur } from "@/lib/game.functions";

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
  const { token, chargement, pools, pool, choisirPool } = useJoueur();
  const q = useQuery({
    queryKey: ["historique", token],
    enabled: !!token,
    retry: false,
    queryFn: () => historiqueJoueur({ data: { token: token! } }),
  });
  // Les secrets sont déjà classés par % de bonnes réponses décroissant côté serveur.
  const courant = q.data?.find((p) => p.id === pool?.id);

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Historique" retour="/" />
      <div className="flex-1 space-y-4 px-5 py-5">
        {pools.length > 0 && <PoolSelect pools={pools} actif={pool?.id ?? null} onChange={choisirPool} />}

        {chargement || (pool && q.isLoading) ? (
          <Chargement />
        ) : !pool ? (
          <AucunPool />
        ) : !courant?.revele ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            La Voix n'a pas encore rendu les réponses de ce pool disponibles. 🤫
          </Card>
        ) : courant.secrets.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            Aucun secret dans ce pool pour l'instant.
          </Card>
        ) : (
          courant.secrets.map((s, i) => (
            <Card key={s.id}>
              <div className="flex items-start gap-3">
                <span className="font-display text-xs text-primary">#{i + 1}</span>
                <p className="flex-1 text-sm leading-snug">« {s.texte} »</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {s.estFaux ? (
                  <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] text-accent">Faux secret</span>
                ) : (
                  <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] text-success">
                    {s.proprietaire ?? "—"}
                  </span>
                )}
                <span className="ml-auto font-display text-sm text-primary">{s.pourcentage}%</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${s.pourcentage}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {s.justes} bonne{s.justes > 1 ? "s" : ""} réponse{s.justes > 1 ? "s" : ""} sur {s.reponses}{" "}
                réponse{s.reponses > 1 ? "s" : ""}
              </p>
            </Card>
          ))
        )}
      </div>
      <BottomNav actif="historique" />
    </Screen>
  );
}
