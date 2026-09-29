import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Screen, TopBar, PrimaryAction, Card } from "@/components/app-shell";
import { adminCreerSoiree } from "@/lib/game.functions";
import { session } from "@/lib/session";

export const Route = createFileRoute("/admin/nouvelle-soiree")({
  head: () => ({
    meta: [
      { title: "Créer une soirée — Secret Story Afterwork" },
      { name: "description", content: "Nom, lieu et pools de votre soirée." },
      { property: "og:title", content: "Créer une soirée" },
      { property: "og:description", content: "Préparez vos pools en une minute." },
    ],
  }),
  component: NouvelleSoiree,
});

const champ = "mt-2 h-13 w-full rounded-xl border border-input bg-surface px-4 outline-none focus:border-primary";

function NouvelleSoiree() {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [lieu, setLieu] = useState("");
  const [code, setCode] = useState("");
  const [pools, setPools] = useState<string[]>(["", "", ""]);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!session.admin()) navigate({ to: "/admin" });
    // Proposition de code à 4 chiffres (modifiable).
    setCode(String(Math.floor(1000 + Math.random() * 9000)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const creer = async () => {
    const admin = session.admin();
    if (!admin) return navigate({ to: "/admin" });
    if (!nom.trim()) return setErreur("Donnez un nom à la soirée.");
    if (!/^\d{4}$/.test(code)) return setErreur("Le code doit contenir 4 chiffres.");
    setEnvoi(true);
    try {
      const { soireeId } = await adminCreerSoiree({
        data: {
          code: admin,
          nom: nom.trim(),
          lieu: lieu.trim(),
          codeSoiree: code,
          pools: pools.map((p) => p.trim()).filter(Boolean),
        },
      });
      session.setAdminSoiree(soireeId);
      navigate({ to: "/admin/soiree" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible.");
      setEnvoi(false);
    }
  };

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Créer une soirée" retour="/admin/soiree" />
      <div className="flex flex-1 flex-col gap-5 px-5 py-6">
        <div>
          <label className="eyebrow" htmlFor="nom">Nom de la soirée</label>
          <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} className={champ} />
        </div>
        <div>
          <label className="eyebrow" htmlFor="lieu">Lieu</label>
          <input id="lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} className={champ} />
        </div>

        <div>
          <p className="eyebrow">Pools (vous pourrez en ajouter plus tard)</p>
          <div className="mt-2 space-y-2">
            {pools.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={p}
                  placeholder={`Nom du pool ${i + 1}`}
                  onChange={(e) => setPools(pools.map((x, j) => (j === i ? e.target.value : x)))}
                  className="h-13 w-full rounded-xl border border-input bg-surface px-4 outline-none focus:border-primary"
                />
                {pools.length > 1 && (
                  <button
                    type="button"
                    aria-label="Retirer ce pool"
                    onClick={() => setPools(pools.filter((_, j) => j !== i))}
                    className="grid size-13 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {pools.length < 10 && (
              <button
                type="button"
                onClick={() => setPools([...pools, ""])}
                className="h-12 w-full rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                + Ajouter un pool
              </button>
            )}
          </div>
        </div>

        <Card className="bg-surface-2">
          <label className="eyebrow" htmlFor="code">Code à donner aux joueurs (4 chiffres)</label>
          <input
            id="code"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mt-1 w-full bg-transparent font-display text-3xl tracking-[0.25em] text-primary outline-none"
          />
        </Card>

        {erreur && <p className="text-center text-sm text-destructive">{erreur}</p>}

        <div className="mt-auto pt-4">
          <PrimaryAction onClick={envoi ? undefined : creer}>Créer la soirée</PrimaryAction>
        </div>
      </div>
    </Screen>
  );
}
