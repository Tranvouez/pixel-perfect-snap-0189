import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SOIREE, TEAMS, joueur, statsSecret, team } from "@/lib/demo-data";
import { Screen, TopBar, Card, PrimaryAction, TeamDot } from "@/components/app-shell";

export const Route = createFileRoute("/admin/soiree")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Secret Story Afterwork" },
      { name: "description", content: "Pools, joueurs connectés, réponses et révélations." },
      { property: "og:title", content: "Tableau de bord animateur" },
      { property: "og:description", content: "Lancez les pools et révélez les secrets un par un." },
    ],
  }),
  component: TableauDeBord,
});

const LIBELLE_STATUT = {
  a_venir: "À venir",
  en_cours: "En cours",
  verrouille: "Verrouillé",
  termine: "Terminé",
} as const;

function TableauDeBord() {
  const [onglet, setOnglet] = useState<"pools" | "joueurs" | "secrets">("pools");
  const pool = SOIREE.pools.find((p) => p.statut === "en_cours")!;
  const aRepondu = Object.keys(pool.secrets[0]?.reponses ?? {}).length;
  const total = pool.joueurIds.length;
  const prochain = pool.secrets.find((s) => !s.revele);

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Console animateur" retour="/admin" />
      <div className="flex-1 space-y-5 px-5 py-5">
        <Card className="glow-top">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow">{SOIREE.nom}</p>
              <p className="mt-1 font-display text-xl">{pool.nom}</p>
            </div>
            <span className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-accent">
              En direct
            </span>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <p className="font-display text-4xl leading-none">
              {aRepondu}
              <span className="text-xl text-muted-foreground">/{total}</span>
            </p>
            <p className="pb-1 text-xs text-muted-foreground">joueurs ont répondu</p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(aRepondu / total) * 100}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="h-12 rounded-xl border border-border bg-surface-2 text-sm font-medium"
            >
              Verrouiller
            </button>
            <Link
              to="/revelation"
              className="grid h-12 place-items-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground"
            >
              Révéler le suivant
            </Link>
          </div>
          {prochain && (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              Prochain : « {prochain.texte} »
            </p>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1">
          {(["pools", "joueurs", "secrets"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOnglet(o)}
              className={`rounded-lg py-2 text-xs font-medium capitalize ${
                onglet === o ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {onglet === "pools" && (
          <div className="space-y-2">
            {SOIREE.pools.map((p) => (
              <Card key={p.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.joueurIds.length} joueurs · {p.secrets.length} secrets
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                    p.statut === "en_cours"
                      ? "bg-accent/15 text-accent"
                      : p.statut === "termine"
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/15 text-primary"
                  }`}
                >
                  {LIBELLE_STATUT[p.statut]}
                </span>
              </Card>
            ))}
            <button
              type="button"
              className="h-13 w-full rounded-xl border border-dashed border-border text-sm text-muted-foreground"
            >
              + Ajouter un pool
            </button>
          </div>
        )}

        {onglet === "joueurs" && (
          <div className="space-y-4">
            {TEAMS.map((t) => (
              <div key={t.id}>
                <div className="flex items-center gap-2">
                  <TeamDot couleur={t.couleur} />
                  <p className="text-xs font-semibold">{t.nom}</p>
                </div>
                <div className="mt-2 space-y-2">
                  {SOIREE.joueurs
                    .filter((j) => j.teamId === t.id)
                    .map((j) => (
                      <Card key={j.id} className="flex items-center gap-3 py-3">
                        <span className="grid size-9 place-items-center rounded-full bg-surface-2 font-display text-sm">
                          {j.pseudo[0]}
                        </span>
                        <span className="text-sm">{j.pseudo}</span>
                        <span
                          className={`ml-auto text-[10px] uppercase tracking-[0.12em] ${
                            j.enLigne ? "text-success" : "text-muted-foreground"
                          }`}
                        >
                          {j.enLigne ? "En ligne" : "Absent"}
                        </span>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {onglet === "secrets" && (
          <div className="space-y-2">
            {pool.secrets.map((s) => {
              const st = statsSecret(s);
              const prop = joueur(s.proprietaireId);
              return (
                <Card key={s.id}>
                  <p className="text-sm leading-snug">« {s.texte} »</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px]">
                    {prop ? (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">
                        {prop.pseudo} · {team(prop.teamId)?.nom}
                      </span>
                    ) : (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">
                        Faux secret
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {s.revele ? `${st.justes}/${st.total} bonnes` : "Non révélé"}
                    </span>
                  </div>
                </Card>
              );
            })}
            <button
              type="button"
              className="h-13 w-full rounded-xl border border-dashed border-border text-sm text-muted-foreground"
            >
              + Ajouter un secret
            </button>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <PrimaryAction to="/historique" variant="ghost">
            Historique de la soirée
          </PrimaryAction>
        </div>
      </div>
    </Screen>
  );
}
