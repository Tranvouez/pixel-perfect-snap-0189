import { Card } from "@/components/app-shell";

type PoolItem = { id: string; nom: string };

/** Sélecteur de pool (noms fournis par l'admin, aucun libellé codé en dur). */
export function PoolSelect({
  pools,
  actif,
  onChange,
}: {
  pools: PoolItem[];
  actif: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Choix du pool">
      {pools.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={actif === p.id}
          onClick={() => onChange(p.id)}
          className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium ${
            actif === p.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-surface text-muted-foreground"
          }`}
        >
          {p.nom}
        </button>
      ))}
    </div>
  );
}

export function AucunPool() {
  return (
    <Card className="py-10 text-center">
      <p className="font-display text-lg">Aucun pool ouvert</p>
      <p className="mt-2 text-sm text-muted-foreground">
        La Voix n'a pas encore ouvert de pool. Il apparaîtra ici dès qu'il sera disponible.
      </p>
    </Card>
  );
}

export function Chargement() {
  return <Card className="py-10 text-center text-sm text-muted-foreground">Chargement…</Card>;
}

/** Affiche l'erreur au lieu d'un chargement sans fin. */
export function ErreurChargement({ erreur, onRetry }: { erreur: unknown; onRetry: () => void }) {
  return (
    <Card className="space-y-3 py-8 text-center">
      <p className="text-sm text-destructive">Impossible de charger les données.</p>
      <p className="break-words text-xs text-muted-foreground">
        {erreur instanceof Error ? erreur.message : "Erreur inconnue."}
      </p>
      <button type="button" onClick={onRetry} className="h-11 rounded-xl border border-border bg-surface-2 px-4 text-sm">
        Réessayer
      </button>
    </Card>
  );
}
