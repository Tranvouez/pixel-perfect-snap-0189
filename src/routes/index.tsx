
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/logo-secret-story.png.asset.json";
import { Screen, PrimaryAction } from "@/components/app-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Secret Story Afterwork — Rejoindre la soirée" },
      {
        name: "description",
        content:
          "Rejoignez la soirée avec le code fourni par l'animateur.",
      },
      { property: "og:title", content: "Secret Story Afterwork" },
      {
        property: "og:description",
        content:
          "Le jeu de secrets de vos soirées entre collègues, directement dans le navigateur.",
      },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const [code, setCode] = useState("");

  return (
    <Screen className="glow-top flex flex-col px-6 pb-10 pt-8">
      <img
        src={logo.url}
        alt="Secret Story de rentrée de la DMR"
        className="neon mx-auto w-full max-w-[300px] rounded-3xl"
      />

      <h1 className="sr-only">Secret Story Afterwork</h1>

      <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
        Entrez le code de la soirée communiqué par l'animateur pour rejoindre
        le jeu.
      </p>

      <div className="mt-10">
        <label
          htmlFor="code-soiree"
          className="eyebrow block"
        >
          Code de la soirée
        </label>

        <input
          id="code-soiree"
          type="text"
          inputMode="text"
          autoComplete="off"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="EX : ABC123"
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 text-center font-display text-2xl tracking-[0.2em] outline-none placeholder:text-muted-foreground placeholder:tracking-normal focus:border-primary"
        />
      </div>

      <div className="mt-6 space-y-3">
        <PrimaryAction to="/rejoindre">
          Rejoindre la soirée
        </PrimaryAction>

        <PrimaryAction to="/admin" variant="ghost">
          Espace animateur
        </PrimaryAction>
      </div>

      <div className="mt-auto pt-10 text-xs text-muted-foreground">
        Le code vous est communiqué par l'animateur de la soirée.
      </div>
    </Screen>
  );
}
