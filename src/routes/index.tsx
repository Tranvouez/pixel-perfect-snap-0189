
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/logo-secret-story.png.asset.json";
import { Screen, PrimaryAction } from "@/components/app-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Secret Story Afterwork — Rejoindre la soirée" },
      {
        name: "description",
        content: "Rejoignez la soirée avec le code.",
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
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");

  const rejoindre = () => {
    if (code === "2007") {
      setErreur("");

      // Le code est valide : accès à la page suivante
      navigate({ to: "/rejoindre" });
      return;
    }

    setErreur("Code de soirée incorrect.");
  };

  return (
    <Screen className="glow-top flex flex-col px-6 pb-10 pt-8">
      <img
        src={logo.url}
        alt="Secret Story de rentrée de la DMR"
        className="neon mx-auto w-full max-w-[300px] rounded-3xl"
      />

      <h1 className="sr-only">Secret Story Afterwork</h1>

      <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
        Saisir le code de la soirée, si besoin, contacter Benjamin Castaldi.
      </p>

      <div className="mt-10">
        <label htmlFor="code-soiree" className="eyebrow block">
          Code de la soirée
        </label>

        <input
          id="code-soiree"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={code}
          onChange={(e) => {
            const valeur = e.target.value.replace(/\D/g, "");
            setCode(valeur);
            setErreur("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              rejoindre();
            }
          }}
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 text-center font-display text-2xl tracking-[0.2em] outline-none focus:border-primary"
        />

        {erreur && (
          <p className="mt-3 text-center text-sm text-destructive">
            {erreur}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <PrimaryAction onClick={rejoindre}>
          Rejoindre la soirée
        </PrimaryAction>

        <PrimaryAction to="/admin" variant="ghost">
          Pas là bonne voie, c'est pour la voix
        </PrimaryAction>
      </div>

    </Screen>
  );
}

