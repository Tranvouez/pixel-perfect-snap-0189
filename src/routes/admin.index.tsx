import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, PrimaryAction } from "@/components/app-shell";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Espace animateur — Secret Story Afterwork" },
      { name: "description", content: "Connexion de l'animateur pour piloter la soirée." },
      { property: "og:title", content: "Espace animateur" },
      { property: "og:description", content: "Pilotez toute la soirée depuis votre téléphone." },
    ],
  }),
  component: AdminConnexion,
});

function AdminConnexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  return (
    <Screen className="glow-top flex flex-col">
      <TopBar titre="Espace animateur" retour="/" />
      <div className="flex flex-1 flex-col px-5 py-8">
        <h1 className="font-display text-2xl font-semibold leading-tight">
          Pilotez la soirée
          <br />
          depuis votre poche
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Connectez-vous pour créer les pools, saisir les secrets et lancer les révélations.
        </p>

        <label className="eyebrow mt-8 block" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="animateur@soiree.fr"
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <label className="eyebrow mt-5 block" htmlFor="mdp">
          Mot de passe
        </label>
        <input
          id="mdp"
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="••••••••"
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 outline-none placeholder:text-muted-foreground focus:border-primary"
        />

        <div className="mt-8 space-y-3">
          <PrimaryAction to="/admin/soiree">Se connecter</PrimaryAction>
          <PrimaryAction to="/admin/nouvelle-soiree" variant="ghost">
            Créer une nouvelle soirée
          </PrimaryAction>
        </div>

        <p className="mt-auto pt-10 text-xs text-muted-foreground">
          Démonstration : la connexion n'est pas encore branchée, les boutons ouvrent directement
          les écrans.
        </p>
      </div>
    </Screen>
  );
}
