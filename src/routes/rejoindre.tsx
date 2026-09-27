import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, PrimaryAction } from "@/components/app-shell";

export const Route = createFileRoute("/rejoindre")({
  head: () => ({
    meta: [
      { title: "Rejoindre — Secret Story Afterwork" },
      {
        name: "description",
        content: "Entrez votre prénom pour rejoindre la soirée.",
      },
      { property: "og:title", content: "Rejoindre une soirée Secret Story" },
      {
        property: "og:description",
        content: "Entrez votre prénom et c'est parti pour les secrets.",
      },
    ],
  }),
  component: Rejoindre,
});

function Rejoindre() {
  const [pseudo, setPseudo] = useState("");
  const [nb, setNb] = useState(1);

  return (
    <Screen className="flex flex-col">
      <TopBar titre="Rejoindre une soirée" retour="/" />

      <div className="flex flex-1 flex-col px-5 py-6">
        <label className="eyebrow block" htmlFor="pseudo">
          {nb > 1
            ? "Vos prénoms"
            : "Votre prénom ou pseudo"}
        </label>

        <input
          id="pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 text-base outline-none focus:border-primary"
        />

        <p className="eyebrow mt-6">
          Vous jouez à combien sur ce téléphone ?
        </p>

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
            {nb}{" "}
            <span className="text-sm text-muted-foreground">
              {nb > 1 ? "personnes" : "personne"}
            </span>
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
          <PrimaryAction to="/jeu">
            Entrer dans la soirée
          </PrimaryAction>
        </div>
      </div>
    </Screen>
  );
}
