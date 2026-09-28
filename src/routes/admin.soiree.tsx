import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen, TopBar, Card } from "@/components/app-shell";
import { useSync } from "@/hooks/use-sync";
import {
  adminAjouterJoueur,
  adminDonnees,
  adminLogin,
  adminSauverPool,
  adminSauverSecret,
  adminSupprimerJoueur,
  adminSupprimerPool,
  adminSupprimerSecret,
} from "@/lib/game.functions";
import { pct, statsJoueurPool, statsSecret } from "@/lib/stats";
import { session } from "@/lib/session";

export const Route = createFileRoute("/admin/soiree")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Secret Story Afterwork" },
      { name: "description", content: "Pools, secrets, joueurs, réponses et révélations." },
      { property: "og:title", content: "Tableau de bord animateur" },
      { property: "og:description", content: "Gérez les pools, les secrets et l'accès aux révélations." },
    ],
  }),
  component: TableauDeBord,
});

type Donnees = Awaited<ReturnType<typeof adminDonnees>>;
type Ctx = {
  code: string;
  soireeId: string;
  d: Donnees;
  agir: (fn: () => Promise<unknown>) => Promise<boolean>;
};

const ENLIGNE_MS = 60_000;
const enLigne = (ls: string | null) => !!ls && Date.now() - new Date(ls).getTime() < ENLIGNE_MS;
const champ = "h-12 w-full rounded-xl border border-input bg-surface px-4 text-sm outline-none focus:border-primary";
const bouton = "h-12 rounded-xl border border-border bg-surface-2 px-4 text-sm font-medium";
const pointille = "h-13 w-full rounded-xl border border-dashed border-border text-sm text-muted-foreground";

function TableauDeBord() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [code, setCode] = useState<string | null>(null);
  const [soireeSel, setSoireeSel] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<"pools" | "joueurs" | "secrets">("pools");
  const [detail, setDetail] = useState<string | null>(null);
  const [formPool, setFormPool] = useState<string | "new" | null>(null);
  const [formSecret, setFormSecret] = useState<string | "new" | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const c = session.admin();
    if (!c) {
      navigate({ to: "/admin" });
      return;
    }
    setCode(c);
    setSoireeSel(session.adminSoiree());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const soirees = useQuery({
    queryKey: ["admin-soirees", code],
    enabled: !!code,
    retry: false,
    queryFn: () => adminLogin({ data: { code: code! } }),
  });
  useEffect(() => {
    if (soirees.error) {
      session.setAdmin(null);
      navigate({ to: "/admin" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soirees.error]);

  const liste = soirees.data?.soirees ?? [];
  const soireeId = liste.find((s) => s.id === soireeSel)?.id ?? liste[0]?.id ?? null;

  // Rafraîchi en temps réel (signal de sync) + toutes les 15 s pour la présence « en ligne ».
  const q = useQuery({
    queryKey: ["admin", code, soireeId],
    enabled: !!code && !!soireeId,
    refetchInterval: 15_000,
    queryFn: () => adminDonnees({ data: { code: code!, soireeId: soireeId! } }),
  });
  useSync(soireeId);

  const agir: Ctx["agir"] = async (fn) => {
    setErreur("");
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      return true;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
      return false;
    }
  };

  const changerSoiree = (id: string) => {
    setSoireeSel(id);
    session.setAdminSoiree(id);
    setDetail(null);
    setFormPool(null);
    setFormSecret(null);
  };

  const d = q.data;
  const ctx: Ctx | null = code && soireeId && d ? { code, soireeId, d, agir } : null;

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Console animateur" retour="/admin" />
      <div className="flex-1 space-y-5 px-5 py-5">
        {liste.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {liste.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => changerSoiree(s.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium ${
                  soireeId === s.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {s.nom}
              </button>
            ))}
            <Link
              to="/admin/nouvelle-soiree"
              className="shrink-0 rounded-full border border-dashed border-border px-4 py-2 text-xs text-muted-foreground"
            >
              + Nouvelle soirée
            </Link>
          </div>
        )}

        {soirees.data && liste.length === 0 && (
          <Card className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Aucune soirée pour l'instant.</p>
            <Link
              to="/admin/nouvelle-soiree"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Créer une soirée
            </Link>
          </Card>
        )}

        {erreur && (
          <Card className="border-destructive/50 text-sm text-destructive">
            {erreur}
          </Card>
        )}

        {!ctx ? (
          liste.length > 0 && <Card className="py-8 text-center text-sm text-muted-foreground">Chargement…</Card>
        ) : formPool ? (
          <PoolForm
            key={formPool}
            ctx={ctx}
            poolId={formPool === "new" ? null : formPool}
            onClose={() => setFormPool(null)}
          />
        ) : formSecret ? (
          <SecretForm
            key={formSecret}
            ctx={ctx}
            secretId={formSecret === "new" ? null : formSecret}
            onClose={() => setFormSecret(null)}
          />
        ) : detail && ctx.d.pools.some((p) => p.id === detail) ? (
          <PoolDetail
            ctx={ctx}
            poolId={detail}
            onBack={() => setDetail(null)}
            onEdit={() => setFormPool(detail)}
            onDeleted={() => setDetail(null)}
          />
        ) : (
          <>
            <Resume ctx={ctx} />

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
              <OngletPools ctx={ctx} onOpen={setDetail} onNew={() => setFormPool("new")} />
            )}
            {onglet === "joueurs" && <OngletJoueurs ctx={ctx} />}
            {onglet === "secrets" && (
              <OngletSecrets ctx={ctx} onOpen={setFormSecret} onNew={() => setFormSecret("new")} />
            )}
          </>
        )}
      </div>
    </Screen>
  );
}

/* ---------- Résumé de la soirée ---------- */

function Resume({ ctx }: { ctx: Ctx }) {
  const { d } = ctx;
  const enLigneN = d.joueurs.filter((j) => enLigne(j.last_seen)).length;
  return (
    <Card className="glow-top">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="eyebrow">{d.soiree.nom}</p>
          <p className="mt-1 font-display text-xl">Code : {d.soiree.code}</p>
        </div>
        <span className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-accent">
          En direct
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="font-display text-2xl">
            {enLigneN}
            <span className="text-base text-muted-foreground">/{d.joueurs.length}</span>
          </p>
          <p className="eyebrow mt-1">En ligne</p>
        </div>
        <div>
          <p className="font-display text-2xl">{d.pools.filter((p) => p.accessible).length}</p>
          <p className="eyebrow mt-1">Pools ouverts</p>
        </div>
        <div>
          <p className="font-display text-2xl">{d.secrets.length}</p>
          <p className="eyebrow mt-1">Secrets</p>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Contrôle « Rendre le pool visible » ---------- */

function Visibilite({ ctx, pool }: { ctx: Ctx; pool: Donnees["pools"][number] }) {
  const set = (accessible: boolean) =>
    ctx.agir(() =>
      adminSauverPool({ data: { code: ctx.code, soireeId: ctx.soireeId, id: pool.id, accessible } }),
    );
  return (
    <div>
      <p className="eyebrow">Rendre le pool visible</p>
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => pool.accessible !== v && set(v)}
            className={`rounded-lg py-2 text-sm font-medium ${
              pool.accessible === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {v ? "Oui" : "Non"}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Onglet Pools ---------- */

function OngletPools({ ctx, onOpen, onNew }: { ctx: Ctx; onOpen: (id: string) => void; onNew: () => void }) {
  const { d } = ctx;
  return (
    <div className="space-y-2">
      {d.pools.length === 0 && (
        <Card className="py-8 text-center text-sm text-muted-foreground">Aucun pool pour l'instant.</Card>
      )}
      {d.pools.map((p) => {
        const nbSecrets = d.secrets.filter((s) => s.pool_id === p.id).length;
        return (
          <Card key={p.id} className="space-y-3">
            <button type="button" onClick={() => onOpen(p.id)} className="flex w-full items-center gap-3 text-left">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.nom}</p>
                <p className="text-xs text-muted-foreground">
                  {d.joueurs.length} joueur{d.joueurs.length > 1 ? "s" : ""} · {nbSecrets} secret
                  {nbSecrets > 1 ? "s" : ""}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                  p.accessible ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {p.accessible ? "Accessible" : "Non accessible"}
              </span>
            </button>
            <Visibilite ctx={ctx} pool={p} />
          </Card>
        );
      })}
      <button type="button" onClick={onNew} className={pointille}>
        + Ajouter un pool
      </button>
    </div>
  );
}

/* ---------- Formulaire pool (création / modification) ---------- */

function PoolForm({ ctx, poolId, onClose }: { ctx: Ctx; poolId: string | null; onClose: () => void }) {
  const { d } = ctx;
  const pool = poolId ? d.pools.find((p) => p.id === poolId) : null;
  const [nom, setNom] = useState(pool?.nom ?? "");
  const [sel, setSel] = useState<Set<string>>(
    new Set(d.secrets.filter((s) => pool && s.pool_id === pool.id).map((s) => s.id)),
  );
  const pseudo = (id: string | null) => d.joueurs.find((j) => j.id === id)?.pseudo ?? "?";
  const nomPool = (id: string | null) => d.pools.find((p) => p.id === id)?.nom ?? "un autre pool";

  const enregistrer = async () => {
    if (!nom.trim()) return;
    const ok = await ctx.agir(() =>
      adminSauverPool({
        data: { code: ctx.code, soireeId: ctx.soireeId, id: pool?.id, nom: nom.trim(), secretIds: [...sel] },
      }),
    );
    if (ok) onClose();
  };

  return (
    <div className="space-y-4">
      <p className="eyebrow">{pool ? "Modifier le pool" : "Nouveau pool"}</p>
      <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du pool" className={champ} />

      <p className="eyebrow">Secrets du pool</p>
      <div className="space-y-2">
        {d.secrets.length === 0 && (
          <p className="text-xs text-muted-foreground">Créez d'abord des secrets dans l'onglet « secrets ».</p>
        )}
        {d.secrets.map((s) => {
          const pris = !!s.pool_id && s.pool_id !== pool?.id;
          const coche = sel.has(s.id);
          return (
            <label
              key={s.id}
              className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                pris ? "border-border opacity-50" : coche ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <input
                type="checkbox"
                disabled={pris}
                checked={coche}
                onChange={() => {
                  const n = new Set(sel);
                  if (coche) n.delete(s.id);
                  else n.add(s.id);
                  setSel(n);
                }}
                className="mt-1"
              />
              <span className="flex-1 leading-snug">
                « {s.texte} »
                <span className="mt-1 block text-xs text-muted-foreground">
                  {s.est_faux ? "FAUX SECRET" : pseudo(s.proprietaire_id)}
                  {pris && ` · déjà utilisé (${nomPool(s.pool_id)})`}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onClose} className={bouton}>
          Annuler
        </button>
        <button type="button" onClick={enregistrer} className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          Enregistrer
        </button>
      </div>
    </div>
  );
}

/* ---------- Vue détail d'un pool ---------- */

function PoolDetail({
  ctx,
  poolId,
  onBack,
  onEdit,
  onDeleted,
}: {
  ctx: Ctx;
  poolId: string;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const { d } = ctx;
  const pool = d.pools.find((p) => p.id === poolId)!;
  const secrets = d.secrets.filter((s) => s.pool_id === poolId);
  const ids = new Set(secrets.map((s) => s.id));
  const reps = d.reponses.filter((r) => ids.has(r.secret_id));
  const nbJ = d.joueurs.length;
  const possible = secrets.length * nbJ;
  const justesTotal = secrets.reduce((n, s) => n + statsSecret(s, reps).justes, 0);
  const progression = pct(reps.length, possible);

  const revelations = (v: boolean) =>
    ctx.agir(() =>
      adminSauverPool({ data: { code: ctx.code, soireeId: ctx.soireeId, id: poolId, reponsesVisibles: v } }),
    );
  const supprimer = async () => {
    if (!window.confirm(`Supprimer le pool « ${pool.nom} » ? Ses secrets seront conservés sans pool.`)) return;
    if (await ctx.agir(() => adminSupprimerPool({ data: { code: ctx.code, soireeId: ctx.soireeId, id: poolId } }))) {
      onDeleted();
    }
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-xs text-muted-foreground">
        ← Retour aux pools
      </button>

      <Card className="glow-top space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-xl">{pool.nom}</p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
              pool.accessible ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            {pool.accessible ? "Accessible" : "Non accessible"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-display text-2xl">{nbJ}</p>
            <p className="eyebrow mt-1">Joueurs</p>
          </div>
          <div>
            <p className="font-display text-2xl">{secrets.length}</p>
            <p className="eyebrow mt-1">Secrets</p>
          </div>
          <div>
            <p className="font-display text-2xl">{reps.length}</p>
            <p className="eyebrow mt-1">Réponses</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progression générale</span>
            <span>
              {reps.length} / {possible} · {progression} %
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progression}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Bonnes réponses : {justesTotal} / {reps.length} · {pct(justesTotal, reps.length)} %
          </p>
        </div>

        <Visibilite ctx={ctx} pool={pool} />

        <div>
          <p className="eyebrow">Révélations : {pool.reponses_visibles ? "disponibles" : "masquées"}</p>
          <div className="mt-2">
            {pool.reponses_visibles ? (
              <button type="button" onClick={() => revelations(false)} className={`${bouton} w-full`}>
                Cacher les réponses
              </button>
            ) : (
              <button
                type="button"
                disabled={!pool.accessible}
                onClick={() => revelations(true)}
                className="h-12 w-full rounded-xl bg-accent text-sm font-semibold text-accent-foreground disabled:opacity-40"
              >
                Afficher les réponses
              </button>
            )}
          </div>
          {!pool.accessible && !pool.reponses_visibles && (
            <p className="mt-2 text-xs text-muted-foreground">Rendez d'abord le pool visible.</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Chaque joueur navigue ensuite librement dans les secrets : aucune position n'est imposée.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onEdit} className={bouton}>
            Modifier
          </button>
          <button type="button" onClick={supprimer} className={`${bouton} text-destructive`}>
            Supprimer
          </button>
        </div>
      </Card>

      <p className="eyebrow">Secrets du pool</p>
      {secrets.length === 0 && (
        <Card className="py-6 text-center text-sm text-muted-foreground">Aucun secret dans ce pool.</Card>
      )}
      {secrets.map((s) => {
        const st = statsSecret(s, reps);
        const prop = d.joueurs.find((j) => j.id === s.proprietaire_id)?.pseudo;
        return (
          <Card key={s.id} className="space-y-2">
            <p className="text-sm leading-snug">« {s.texte} »</p>
            <p className="text-xs">
              <span className={`rounded-full px-2 py-0.5 ${s.est_faux ? "bg-accent/15 text-accent" : "bg-success/15 text-success"}`}>
                {s.est_faux ? "Faux secret" : `Propriétaire : ${prop ?? "?"}`}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                Réponses : {st.reponses} / {nbJ}
              </span>
              <span>Remplissage : {pct(st.reponses, nbJ)} %</span>
              <span>
                Bonnes : {st.justes} / {st.reponses}
              </span>
              <span className="text-primary">Réussite : {st.pourcentage} %</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Onglet Secrets ---------- */

function OngletSecrets({ ctx, onOpen, onNew }: { ctx: Ctx; onOpen: (id: string) => void; onNew: () => void }) {
  const { d } = ctx;
  return (
    <div className="space-y-2">
      {d.secrets.length === 0 && (
        <Card className="py-8 text-center text-sm text-muted-foreground">Aucun secret pour l'instant.</Card>
      )}
      {d.secrets.map((s) => {
        const prop = d.joueurs.find((j) => j.id === s.proprietaire_id)?.pseudo;
        const pool = d.pools.find((p) => p.id === s.pool_id);
        const st = statsSecret(s, d.reponses);
        return (
          <button key={s.id} type="button" onClick={() => onOpen(s.id)} className="block w-full text-left">
            <Card>
              <p className="text-sm leading-snug">« {s.texte} »</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 ${s.est_faux ? "bg-accent/15 text-accent" : "bg-success/15 text-success"}`}>
                  {s.est_faux ? "Faux secret" : (prop ?? "?")}
                </span>
                <span className={`rounded-full px-2 py-0.5 ${pool ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {pool ? pool.nom : "Sans pool"}
                </span>
                <span className="text-muted-foreground">
                  {st.reponses} rép. · {st.justes} bonnes ({st.pourcentage} %)
                </span>
              </div>
            </Card>
          </button>
        );
      })}
      <button type="button" onClick={onNew} className={pointille}>
        + Ajouter un secret
      </button>
    </div>
  );
}

function SecretForm({ ctx, secretId, onClose }: { ctx: Ctx; secretId: string | null; onClose: () => void }) {
  const { d } = ctx;
  const s = secretId ? d.secrets.find((x) => x.id === secretId) : null;
  const [texte, setTexte] = useState(s?.texte ?? "");
  const [estFaux, setEstFaux] = useState(s?.est_faux ?? false);
  const [proprietaire, setProprietaire] = useState<string>(s?.proprietaire_id ?? "");
  const [poolId, setPoolId] = useState<string>(s?.pool_id ?? "");

  const enregistrer = async () => {
    if (!texte.trim()) return;
    const ok = await ctx.agir(() =>
      adminSauverSecret({
        data: {
          code: ctx.code,
          soireeId: ctx.soireeId,
          id: s?.id,
          texte: texte.trim(),
          estFaux,
          proprietaireId: estFaux ? null : proprietaire || null,
          poolId: poolId || null,
        },
      }),
    );
    if (ok) onClose();
  };
  const supprimer = async () => {
    if (!s || !window.confirm("Supprimer ce secret ?")) return;
    const ok = await ctx.agir(() =>
      adminSupprimerSecret({ data: { code: ctx.code, soireeId: ctx.soireeId, id: s.id } }),
    );
    if (ok) onClose();
  };

  return (
    <div className="space-y-4">
      <p className="eyebrow">{s ? "Modifier le secret" : "Nouveau secret"}</p>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={3}
        placeholder="Texte du secret"
        className="w-full rounded-xl border border-input bg-surface p-4 text-sm outline-none focus:border-primary"
      />

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
        {([false, true] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setEstFaux(v)}
            className={`rounded-lg py-2 text-sm font-medium ${
              estFaux === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {v ? "Faux secret" : "Vrai secret"}
          </button>
        ))}
      </div>

      {!estFaux && (
        <div>
          <p className="eyebrow">Propriétaire</p>
          <select value={proprietaire} onChange={(e) => setProprietaire(e.target.value)} className={`${champ} mt-2`}>
            <option value="">— Choisir un joueur —</option>
            {d.joueurs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.pseudo}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <p className="eyebrow">Pool (un seul par secret)</p>
        <select value={poolId} onChange={(e) => setPoolId(e.target.value)} className={`${champ} mt-2`}>
          <option value="">Aucun pool</option>
          {d.pools.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onClose} className={bouton}>
          Annuler
        </button>
        <button type="button" onClick={enregistrer} className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          Enregistrer
        </button>
      </div>
      {s && (
        <button type="button" onClick={supprimer} className={`${bouton} w-full text-destructive`}>
          Supprimer ce secret
        </button>
      )}
    </div>
  );
}

/* ---------- Onglet Joueurs ---------- */

function OngletJoueurs({ ctx }: { ctx: Ctx }) {
  const { d } = ctx;
  const [pseudo, setPseudo] = useState("");
  const poolsAvecSecrets = d.pools
    .map((p) => ({ p, secrets: d.secrets.filter((s) => s.pool_id === p.id) }))
    .filter((x) => x.secrets.length > 0);
  const enLigneJ = d.joueurs.filter((j) => enLigne(j.last_seen));
  const tries = [...d.joueurs].sort(
    (a, b) => Number(enLigne(b.last_seen)) - Number(enLigne(a.last_seen)) || a.pseudo.localeCompare(b.pseudo),
  );

  const ajouter = async () => {
    if (!pseudo.trim()) return;
    if (await ctx.agir(() => adminAjouterJoueur({ data: { code: ctx.code, soireeId: ctx.soireeId, pseudo: pseudo.trim() } }))) {
      setPseudo("");
    }
  };

  return (
    <div className="space-y-4">
      <p className="eyebrow">
        {d.joueurs.length} téléphones · {d.joueurs.reduce((n, j) => n + j.nb_participants, 0)} participants ·{" "}
        {enLigneJ.length} en ligne
      </p>

      {poolsAvecSecrets.length > 0 && (
        <Card className="space-y-2">
          <p className="eyebrow">Taux de remplissage des joueurs en ligne</p>
          {poolsAvecSecrets.map(({ p, secrets }) => {
            const moy = enLigneJ.length
              ? Math.round(
                  enLigneJ.reduce((n, j) => n + statsJoueurPool(j.id, secrets, d.reponses).remplissage, 0) /
                    enLigneJ.length,
                )
              : 0;
            return (
              <div key={p.id}>
                <div className="flex justify-between text-xs">
                  <span className="truncate">{p.nom}</span>
                  <span className="text-muted-foreground">{enLigneJ.length ? `${moy} %` : "—"}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${moy}%` }} />
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <div className="space-y-2">
        {tries.map((j) => {
          const on = enLigne(j.last_seen);
          return (
            <Card key={j.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-surface-2 font-display text-sm">
                  {j.pseudo[0]}
                </span>
                <span className="text-sm">{j.pseudo}</span>
                {j.nb_participants > 1 && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
                    {j.nb_participants} joueurs
                  </span>
                )}
                <span
                  className={`ml-auto text-[10px] uppercase tracking-[0.12em] ${
                    on ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {on ? "● En ligne" : "Absent"}
                </span>
                <button
                  type="button"
                  aria-label={`Retirer ${j.pseudo}`}
                  onClick={() =>
                    window.confirm(`Retirer ${j.pseudo} de la soirée ?`) &&
                    ctx.agir(() => adminSupprimerJoueur({ data: { code: ctx.code, soireeId: ctx.soireeId, id: j.id } }))
                  }
                  className="text-xs text-muted-foreground"
                >
                  ✕
                </button>
              </div>
              {poolsAvecSecrets.map(({ p, secrets }) => {
                const st = statsJoueurPool(j.id, secrets, d.reponses);
                return (
                  <div key={p.id} className="border-t border-border/60 pt-2 text-xs">
                    <p className="font-medium">{p.nom}</p>
                    <p className="mt-1 text-muted-foreground">
                      {st.repondus} / {st.total} réponses · {st.remplissage} % de remplissage
                    </p>
                    <p className="text-muted-foreground">
                      {st.justes} bonne{st.justes > 1 ? "s" : ""} · {st.pourcentage} % de bonnes réponses
                    </p>
                  </div>
                );
              })}
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Ajouter un joueur"
          className={champ}
        />
        <button type="button" onClick={ajouter} className={`${bouton} shrink-0`}>
          Ajouter
        </button>
      </div>
    </div>
  );
}
