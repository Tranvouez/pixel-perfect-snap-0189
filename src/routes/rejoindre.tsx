import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Screen, TopBar, PrimaryAction } from "@/components/app-shell";
import { inscrire } from "@/lib/game.functions";
import { session } from "@/lib/session";

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
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const navigate = useNavigate();

  // Sans code de soirée valide, retour à l'accueil.
  useEffect(() => {
    if (!session.soiree()) navigate({ to: "/" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrer = async () => {
    const soireeId = session.soiree();
    if (!soireeId) return navigate({ to: "/" });
    if (!pseudo.trim()) return setErreur("Entrez votre prénom pour continuer.");
    setEnvoi(true);
    try {
      const { token } = await inscrire({ data: { soireeId, pseudo: pseudo.trim(), nb } });
      session.setToken(token);
      session.setPool(null);
      navigate({ to: "/jeu" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Inscription impossible, réessayez.");
      setEnvoi(false);
    }
  };

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
          onChange={(e) => {
            setPseudo(e.target.value);
            setErreur("");
          }}
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
          {erreur && <p className="mb-3 text-center text-sm text-destructive">{erreur}</p>}
          <PrimaryAction onClick={envoi ? undefined : entrer}>
            Entrer dans la soirée
          </PrimaryAction>
        </div>
      </div>
    </Screen>
  );
}
