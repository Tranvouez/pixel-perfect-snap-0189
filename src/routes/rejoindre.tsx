import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SOIREE } from "@/lib/demo-data";
import { Screen, TopBar, PrimaryAction } from "@/components/app-shell";

export const Route = createFileRoute("/rejoindre")({
  head: () => ({
    meta: [
      { title: "Rejoindre — Secret Story Afterwork" },
      { name: "description", content: "Entrez le code de la soirée et votre prénom pour jouer." },
      { property: "og:title", content: "Rejoindre une soirée Secret Story" },
      { property: "og:description", content: "Un code, un prénom, et c'est parti pour les secrets." },
    ],
  }),
  component: Rejoindre,
});

function Rejoindre() {
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState(SOIREE.code);
  const [nb, setNb] = useState(1);

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Rejoindre une soirée" retour="/" />
      <div className="flex flex-1 flex-col px-5 py-6">
        <label className="eyebrow" htmlFor="code">
          Code de la soirée
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 text-center font-display text-2xl tracking-[0.3em] outline-none focus:border-primary"
        />

        <label className="eyebrow mt-6 block" htmlFor="pseudo">
          {nb > 1 ? "Vos prénoms (ex : Léa & Tom)" : "Votre prénom ou pseudo"}
        </label>
        <input
          id="pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder={nb > 1 ? "Léa & Tom" : "Théo"}
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
        />

        <p className="eyebrow mt-6">Combien jouez-vous sur ce téléphone ?</p>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-surface p-2">
          <button
            type="button"
            onClick={() => setNb((n) => Math.max(1, n - 1))}
            className="grid size-11 place-items-center rounded-lg bg-surface-2 text-xl"
            aria-label="Moins"
          >
            −
          </button>
          <span className="font-display text-2xl">
            {nb} <span className="text-sm text-muted-foreground">{nb > 1 ? "personnes" : "personne"}</span>
          </span>
          <button
            type="button"
            onClick={() => setNb((n) => Math.min(6, n + 1))}
            className="grid size-11 place-items-center rounded-lg bg-surface-2 text-xl"
            aria-label="Plus"
          >
            +
          </button>
        </div>

        <div className="mt-auto pt-8">
          <PrimaryAction to="/jeu">Entrer dans la soirée</PrimaryAction>
        </div>
      </div>
    </Screen>
  );
}
