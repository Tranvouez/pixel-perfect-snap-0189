import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/logo-secret-story.png.asset.json";
import { SOIREE } from "@/lib/demo-data";
import { Screen, PrimaryAction } from "@/components/app-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Secret Story Afterwork — Rejoindre la soirée" },
      {
        name: "description",
        content:
          "Rejoignez la soirée avec un code, associez les secrets aux personnes et suivez les révélations en direct.",
      },
      { property: "og:title", content: "Secret Story Afterwork" },
      {
        property: "og:description",
        content: "Le jeu de secrets de vos soirées entre collègues, directement dans le navigateur.",
      },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  return (
    <Screen className="glow-top flex flex-col px-6 pb-10 pt-8">
      <img
        src={logo.url}
        alt="Secret Story de rentrée de la DMR"
        className="neon mx-auto w-full max-w-[300px] rounded-3xl"
      />
      <h1 className="sr-only">Secret Story Afterwork</h1>
      <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
        Entrez le code de la soirée pour rejoindre la table. Les secrets circulent, à vous de
        deviner à qui ils appartiennent.
      </p>

      <div className="mt-10 flex gap-2">
        {SOIREE.code.split("").map((c, i) => (
          <div
            key={i}
            className="grid aspect-square flex-1 place-items-center rounded-xl border border-primary/50 bg-surface font-display text-3xl text-neon"
          >
            {c}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Code de démonstration · {SOIREE.nom} · {SOIREE.lieu}
      </p>

      <div className="mt-8 space-y-3">
        <PrimaryAction to="/rejoindre">Rejoindre la soirée</PrimaryAction>
        <PrimaryAction to="/admin" variant="ghost">
          Espace animateur
        </PrimaryAction>
      </div>

      <div className="mt-auto pt-10 text-xs text-muted-foreground">
        <Link to="/historique" className="underline underline-offset-4">
          Voir l'historique de la soirée
        </Link>
      </div>
    </Screen>
  );
}
