import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, PrimaryAction, Card } from "@/components/app-shell";

export const Route = createFileRoute("/admin/nouvelle-soiree")({
  head: () => ({
    meta: [
      { title: "Créer une soirée — Secret Story Afterwork" },
      { name: "description", content: "Nom, lieu et nombre de pools de votre soirée." },
      { property: "og:title", content: "Créer une soirée" },
      { property: "og:description", content: "Préparez vos pools en une minute." },
    ],
  }),
  component: NouvelleSoiree,
});

function NouvelleSoiree() {
  const [nom, setNom] = useState("Afterwork du jeudi");
  const [lieu, setLieu] = useState("Le Salon M");
  const [nbPools, setNbPools] = useState(3);
  const code = "A7K9";

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Créer une soirée" retour="/admin" />
      <div className="flex flex-1 flex-col gap-5 px-5 py-6">
        <div>
          <label className="eyebrow" htmlFor="nom">
            Nom de la soirée
          </label>
          <input
            id="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="mt-2 h-13 w-full rounded-xl border border-input bg-surface px-4 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="eyebrow" htmlFor="lieu">
            Lieu
          </label>
          <input
            id="lieu"
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            className="mt-2 h-13 w-full rounded-xl border border-input bg-surface px-4 outline-none focus:border-primary"
          />
        </div>

        <div>
          <p className="eyebrow">Nombre de pools</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNbPools(n)}
                className={`h-13 rounded-xl border font-display text-lg ${
                  nbPools === n ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface"
                }`}
              >
                {n} pools
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-surface-2">
          <p className="eyebrow">Code à donner aux joueurs</p>
          <p className="mt-1 font-display text-3xl tracking-[0.25em] text-primary">{code}</p>
        </Card>

        <div className="mt-auto pt-4">
          <PrimaryAction to="/admin/soiree">Créer la soirée</PrimaryAction>
        </div>
      </div>
    </Screen>
  );
}
