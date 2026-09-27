import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SOIREE, TEAMS } from "@/lib/demo-data";
import { Screen, TopBar, PrimaryAction, TeamDot } from "@/components/app-shell";

export const Route = createFileRoute("/rejoindre")({
  head: () => ({
    meta: [
      { title: "Rejoindre — Secret Story Afterwork" },
      { name: "description", content: "Entrez votre pseudo et choisissez votre team." },
      { property: "og:title", content: "Rejoindre une soirée" },
      { property: "og:description", content: "Pseudo, team, et c'est parti pour les secrets." },
    ],
  }),
  component: Rejoindre,
});

function Rejoindre() {
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState(SOIREE.code);
  const [teamId, setTeamId] = useState(TEAMS[0]!.id);

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
          Votre prénom ou pseudo
        </label>
        <input
          id="pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          placeholder="Théo"
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
        />

        <p className="eyebrow mt-6">Votre team</p>
        <div className="mt-2 space-y-2">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTeamId(t.id)}
              className={`flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left ${
                teamId === t.id ? "border-primary bg-primary/10" : "border-border bg-surface"
              }`}
            >
              <TeamDot couleur={t.couleur} />
              <span className="text-sm font-medium">{t.nom}</span>
              {teamId === t.id && (
                <span className="ml-auto text-xs font-semibold text-primary">Choisie</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <PrimaryAction to="/jeu">Entrer dans la soirée</PrimaryAction>
        </div>
      </div>
    </Screen>
  );
}
