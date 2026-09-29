import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Screen, TopBar, Card, BottomNav } from "@/components/app-shell";
import { AucunPool, Chargement, ErreurChargement, PoolSelect } from "@/components/pool-select";
import { useJoueur } from "@/hooks/use-joueur";
import { revelationPool } from "@/lib/game.functions";
import { revelationIndex } from "@/lib/session";

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

const MESSAGES_VOIX = [
  ["La Voix est muette pour l'instant… 🤫", "Elle fait quelques vocalises et revient bientôt."],
  ["La Voix fait des vocalises. Elle revient bientôt… 🎤", "Encore un peu de patience, les secrets sont sous clé."],
  ["La Voix a un chat dans la gorge. 😶", "Encore un peu de patience, elle se gargarise et revient."],
  ["La Voix est en pause café… ☕", "Les secrets restent bien gardés. Revenez dans un instant."],
] as const;

/** Variante stable pour un pool donné (pas de hasard qui change à chaque rafraîchissement). */
function messageVoix(poolId: string) {
  let h = 0;
  for (const c of poolId) h = (h + c.charCodeAt(0)) % 997;
  return MESSAGES_VOIX[h % MESSAGES_VOIX.length]!;
}

function Revelation() {
  const { token, chargement, pools, pool, choisirPool } = useJoueur();

  const q = useQuery({
    queryKey: ["revelation", token, pool?.id],
    enabled: !!token && !!pool,
    retry: false,
    queryFn: () => revelationPool({ data: { token: token!, poolId: pool!.id } }),
  });
  const d = q.data;
  const secrets = d?.disponible ? d.secrets : [];

  // Position PROPRE à ce téléphone : jamais envoyée au serveur, jamais partagée.
  const [index, setIndex] = useState(0);
  const poolCharge = useRef<string | null>(null);
  useEffect(() => {
    if (pool && poolCharge.current !== pool.id) {
      poolCharge.current = pool.id;
      setIndex(revelationIndex.lire(pool.id));
    }
  }, [pool]);

  const max = Math.max(0, secrets.length - 1);
  const courant = Math.min(index, max);
  const aller = (i: number) => {
    const n = Math.max(0, Math.min(max, i));
    setIndex(n);
    if (pool) revelationIndex.ecrire(pool.id, n);
  };

  // Swipe mobile (local).
  const debut = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) debut.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const a = debut.current;
    debut.current = null;
    if (!t || !a) return;
    const dx = t.clientX - a.x;
    const dy = t.clientY - a.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) aller(courant + (dx < 0 ? 1 : -1));
  };

  const secret = secrets[courant];

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Révélation" retour="/jeu" />
      <div className="glow-top flex-1 space-y-4 px-5 py-5">
        {pools.length > 0 && <PoolSelect pools={pools} actif={pool?.id ?? null} onChange={choisirPool} />}

        {chargement || (pool && q.isLoading) ? (
          <Chargement />
        ) : !pool ? (
          <AucunPool />
        ) : q.error ? (
          <ErreurChargement erreur={q.error} onRetry={() => q.refetch()} />
        ) : !d?.disponible ? (
          <Card className="animate-reveal border-accent/40 py-12 text-center">
            <p className="font-display text-xl leading-snug">{messageVoix(pool.id)[0]}</p>
            <p className="mx-auto mt-3 max-w-[30ch] text-sm text-muted-foreground">{messageVoix(pool.id)[1]}</p>
          </Card>
        ) : !secret ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            Ce pool ne contient aucun secret.
          </Card>
        ) : (
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <p className="text-center text-[10px] uppercase tracking-[0.3em] text-accent">
              {pool.nom} · secret {courant + 1} / {secrets.length}
            </p>

            <Card key={secret.id} className="animate-reveal mt-6 border-accent/40 text-center">
              <span
                className={`inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${
                  secret.estFaux ? "bg-accent/15 text-accent" : "bg-success/15 text-success"
                }`}
              >
                {secret.estFaux ? "Faux secret" : "Secret authentique"}
              </span>
              <p className="mt-4 font-display text-3xl leading-none">
                {secret.estFaux ? "FAUX SECRET" : (secret.proprietaire ?? "—")}
              </p>
              <p className="mx-auto mt-4 max-w-[30ch] text-sm leading-snug text-muted-foreground">
                « {secret.texte} »
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="font-display text-2xl leading-none">
                    {secret.justes}
                    <span className="text-base text-muted-foreground">/{secret.reponses}</span>
                  </p>
                  <p className="eyebrow mt-2">Bonnes réponses</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="font-display text-2xl leading-none text-primary">{secret.pourcentage}%</p>
                  <p className="eyebrow mt-2">Taux de réussite</p>
                </div>
              </div>
            </Card>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={courant === 0}
                onClick={() => aller(courant - 1)}
                className="h-13 flex-1 rounded-xl border border-border bg-surface text-sm disabled:opacity-40"
              >
                ← Précédent
              </button>
              <button
                type="button"
                disabled={courant >= max}
                onClick={() => aller(courant + 1)}
                className="h-13 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                Suivant →
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Parcourez les secrets à votre rythme, glissez ou utilisez les boutons.
            </p>
          </div>
        )}
      </div>
      <BottomNav actif="revelation" />
    </Screen>
  );
}
