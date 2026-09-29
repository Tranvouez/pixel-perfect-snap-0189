import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, TopBar, Card, BottomNav } from "@/components/app-shell";
import { AucunPool, Chargement, ErreurChargement, PoolSelect } from "@/components/pool-select";
import { useJoueur } from "@/hooks/use-joueur";
import { poolJoueur, repondre } from "@/lib/game.functions";
import { FAUX } from "@/lib/stats";

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

type PoolData = Awaited<ReturnType<typeof poolJoueur>>;

function EcranJoueur() {
  const qc = useQueryClient();
  const { token, chargement, moi, pools, pool, choisirPool } = useJoueur();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");

  const cle = ["pool", token, pool?.id];
  const q = useQuery({
    queryKey: cle,
    enabled: !!token && !!pool,
    retry: false,
    queryFn: () => poolJoueur({ data: { token: token!, poolId: pool!.id } }),
  });
  const d = q.data;

  // Ouvre le premier secret sans réponse, une seule fois par pool.
  const init = useRef<string | null>(null);
  useEffect(() => {
    if (d && init.current !== d.pool.id) {
      init.current = d.pool.id;
      setOuvert(d.secrets.find((s) => !d.mesReponses[s.id])?.id ?? null);
    }
  }, [d]);
  useEffect(() => setErreur(""), [pool?.id]);

  const rep = useMutation({
    mutationFn: (v: { secretId: string; choix: string | null }) =>
      repondre({ data: { token: token!, secretId: v.secretId, choix: v.choix } }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: cle });
      const avant = qc.getQueryData<PoolData>(cle);
      if (avant) {
        const mes = { ...avant.mesReponses };
        if (v.choix === null) delete mes[v.secretId];
        else mes[v.secretId] = v.choix;
        // Affichage immédiat du nombre de réponses ; les bonnes réponses viennent du serveur.
        qc.setQueryData<PoolData>(cle, {
          ...avant,
          mesReponses: mes,
          stats: { ...avant.stats, repondus: Object.keys(mes).length },
        });
      }
      return { avant };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.avant) qc.setQueryData(cle, ctx.avant);
      setErreur(e instanceof Error ? e.message : "Réponse non enregistrée.");
    },
    onSuccess: (res) => {
      qc.setQueryData<PoolData>(cle, (old) => (old ? { ...old, stats: res.stats } : old));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: cle }),
  });

  if (chargement) {
    return (
      <Screen className="flex flex-col">
        <TopBar titre="Mon écran" retour="/" />
        <div className="flex-1 px-5 py-5">
          <Chargement />
        </div>
        <BottomNav actif="jeu" />
      </Screen>
    );
  }

  const mes = d?.mesReponses ?? {};
  const participants = d?.participants ?? [];
  const verrouille = !!d?.pool.reponsesVisibles;

  /** Un participant déjà associé à un AUTRE secret ne peut plus être choisi ailleurs. */
  const dejaPris = (participantId: string, secretId: string) =>
    Object.entries(mes).some(([sid, val]) => sid !== secretId && val === participantId);

  const choisir = (secretId: string, valeur: string) => {
    if (!d) return;
    setErreur("");
    const nouveau = mes[secretId] === valeur ? null : valeur; // re-toucher = retirer la réponse
    rep.mutate({ secretId, choix: nouveau });
    if (nouveau) {
      setOuvert(d.secrets.find((x) => x.id !== secretId && !mes[x.id])?.id ?? null);
    }
  };

  return (
    <Screen className="flex flex-col">
      <TopBar titre={pool?.nom ?? "Mon écran"} retour="/" />
      <div className="flex-1 space-y-4 px-5 py-5">
        {pools.length > 0 && <PoolSelect pools={pools} actif={pool?.id ?? null} onChange={choisirPool} />}

        {!pool ? (
          <AucunPool />
        ) : !d ? (
          q.error ? <ErreurChargement erreur={q.error} onRetry={() => q.refetch()} /> : <Chargement />
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {d.moi.pseudo}
                {d.moi.nbParticipants > 1 && ` · ${d.moi.nbParticipants} joueurs`}
              </span>
              <span>
                {d.stats.repondus} / {d.stats.total} réponses
              </span>
            </div>

            {verrouille && (
              <Card className="glow-top neon py-6 text-center">
                <p className="font-display text-lg text-neon">Les réponses sont disponibles</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Les réponses de ce pool ne peuvent plus être modifiées.
                </p>
                <Link
                  to="/revelation"
                  className="mt-4 inline-block rounded-full border border-accent/50 bg-accent/15 px-4 py-2 text-xs uppercase tracking-[0.15em] text-accent"
                >
                  Aller à la révélation
                </Link>
              </Card>
            )}

            {d.secrets.length === 0 ? (
              <Card className="py-8 text-center text-sm text-muted-foreground">
                Ce pool ne contient pas encore de secret.
              </Card>
            ) : (
              <>
                <Card>
                  <p className="eyebrow">Les personnes</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {participants.map((j) => (
                      <span key={j.id} className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium">
                        {j.pseudo}
                      </span>
                    ))}
                    {participants.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        Aucun nom à associer dans ce pool pour l'instant.
                      </span>
                    )}
                  </div>
                </Card>

                <p className="eyebrow pt-1">Les secrets · touchez-en un pour l'associer</p>
                <div className="space-y-2">
                  {d.secrets.map((s, i) => {
                    const val = mes[s.id];
                    const estFaux = val === FAUX;
                    const choisi = !estFaux && val ? participants.find((j) => j.id === val) : null;
                    const estOuvert = !verrouille && ouvert === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`rounded-2xl border bg-card p-4 transition ${
                          estOuvert ? "neon border-primary" : choisi || estFaux ? "border-primary/40" : "border-border"
                        }`}
                      >
                        <button
                          type="button"
                          disabled={verrouille}
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
                          ) : estFaux ? (
                            <span className="rounded-full border border-accent/50 bg-accent/15 px-2.5 py-1 font-semibold text-accent">
                              🎭 Faux secret
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pas encore associé</span>
                          )}
                        </div>
                        {estOuvert && (
                          <div className="mt-3 flex flex-wrap gap-2 pl-7">
                            {participants.map((j) => {
                              const actif = val === j.id;
                              const indisponible = !actif && dejaPris(j.id, s.id);
                              return (
                                <button
                                  key={j.id}
                                  type="button"
                                  disabled={indisponible}
                                  onClick={() => choisir(s.id, j.id)}
                                  className={`h-10 rounded-full border px-4 text-sm ${
                                    actif
                                      ? "border-primary bg-primary/20 text-foreground"
                                      : indisponible
                                        ? "cursor-not-allowed border-border bg-surface/40 text-muted-foreground/50 line-through"
                                        : "border-border bg-surface"
                                  }`}
                                >
                                  {j.pseudo}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => choisir(s.id, FAUX)}
                              className={`h-10 rounded-full border px-4 text-sm ${
                                estFaux ? "border-accent bg-accent/20 text-accent" : "border-dashed border-accent/50 text-accent"
                              }`}
                            >
                              🎭 Faux secret
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {erreur && <p className="text-center text-sm text-destructive">{erreur}</p>}

            <div className="grid grid-cols-3 gap-2 pt-2">
              <Card className="py-3 text-center">
                <p className="font-display text-xl">
                  {d.stats.repondus}
                  <span className="text-sm text-muted-foreground"> / {d.stats.total}</span>
                </p>
                <p className="eyebrow mt-1">Réponses</p>
              </Card>
              <Card className="py-3 text-center">
                <p className="font-display text-xl text-success">{d.stats.justes}</p>
                <p className="eyebrow mt-1">Bonnes</p>
              </Card>
              <Card className="py-3 text-center">
                <p className="font-display text-xl text-primary">{d.stats.pourcentage}%</p>
                <p className="eyebrow mt-1">Réussite</p>
              </Card>
            </div>
          </>
        )}
      </div>
      <BottomNav actif="jeu" />
    </Screen>
  );
}
