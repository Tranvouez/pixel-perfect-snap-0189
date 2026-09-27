
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, PrimaryAction } from "@/components/app-shell";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "La voix " },
      {
        name: "description",
        content: "Espace réservé à la voix.",
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
      setErreur("Code incorrect.");
    }
  };

  return (
    <Screen className="glow-top flex flex-col">
      <TopBar titre="C'est pour la voix" retour="/" />

      <div className="flex flex-1 flex-col px-5 py-8">
        <h1 className="font-display text-2xl font-semibold leading-tight">
          Ici la voix
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
        Un petit code à saisir.
        </p>

        <label className="eyebrow mt-8 block" htmlFor="code">
          Code la voix
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
          Accès réservé à la Voix.
        </p>
      </div>
    </Screen>
  );
}
