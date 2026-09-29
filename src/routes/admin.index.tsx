
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, PrimaryAction } from "@/components/app-shell";
import { adminLogin } from "@/lib/game.functions";
import { session } from "@/lib/session";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "La voix " },
      {
        name: "description",
        content: "Espace réservé à la Voix.",
      },
    ],
  }),
  component: AdminConnexion,
});

function AdminConnexion() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");

  // Le code est vérifié par le serveur : il n'existe plus en clair dans le navigateur.
  const connexion = async () => {
    try {
      await adminLogin({ data: { code: code.trim() } });
      session.setAdmin(code.trim());
      setErreur("");
      navigate({ to: "/admin/soiree" });
    } catch {
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
      </div>
    </Screen>
  );
}
