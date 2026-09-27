
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, PrimaryAction } from "@/components/app-shell";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Espace animateur — Secret Story Afterwork" },
      {
        name: "description",
        content: "Connexion de l'animateur pour piloter la soirée.",
      },
    ],
  }),
  component: AdminConnexion,
});

const CODE_ADMIN = "SECRET2026*";

function AdminConnexion() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");

  const connexion = () => {
    if (code.trim() === CODE_ADMIN) {
      sessionStorage.setItem("admin_authenticated", "true");
      setErreur("");
      navigate({ to: "/admin/soiree" });
    } else {
      setErreur("Code administrateur incorrect.");
    }
  };

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
          Entrez le code administrateur pour accéder à la gestion de la soirée.
        </p>

        <label className="eyebrow mt-8 block" htmlFor="code">
          Code administrateur
        </label>

        <input
          id="code"
          type="password"
          inputMode="text"
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setErreur("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              connexion();
            }
          }}
          placeholder="Entrez le code"
          className="mt-2 h-14 w-full rounded-xl border border-input bg-surface px-4 outline-none placeholder:text-muted-foreground focus:border-primary"
        />

        {erreur && (
          <p className="mt-3 text-sm text-destructive">
            {erreur}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <PrimaryAction onClick={connexion}>
            Se connecter
          </PrimaryAction>

          <PrimaryAction to="/" variant="ghost">
            Retour
          </PrimaryAction>
        </div>

        <p className="mt-auto pt-10 text-xs text-muted-foreground">
          Accès réservé à l'organisateur.
        </p>
      </div>
    </Screen>
  );
}
