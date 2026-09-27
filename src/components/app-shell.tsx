import logo from "@/assets/logo-secret-story.png.asset.json";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-svh">
      <div className={`screen-shell border-x border-border/50 ${className}`}>{children}</div>
    </div>
  );
}

export function TopBar({ titre, retour }: { titre: string; retour?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
      {retour ? (
        <Link
          to={retour}
          className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
          aria-label="Retour"
        >
          ←
        </Link>
      ) : (
        <img src={logo.url} alt="Secret Story" className="size-9 shrink-0 rounded-lg object-cover" />
      )}
      <span className="font-display text-sm tracking-[0.08em]">{titre}</span>
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 ${className}`}>{children}</div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function PrimaryAction({
  children,
  to,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: "primary" | "accent" | "ghost";
}) {
  const base =
    "flex h-13 w-full items-center justify-center rounded-xl px-4 py-4 text-base font-semibold transition active:brightness-95";
  const styles = {
    primary: "bg-neon-gradient text-primary-foreground neon",
    accent: "bg-accent text-accent-foreground",
    ghost: "border border-border bg-surface text-foreground",
  } as const;
  const cls = `${base} ${styles[variant]}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function TeamDot({ couleur }: { couleur: "primary" | "accent" | "success" }) {
  const map = {
    primary: "bg-primary",
    accent: "bg-accent",
    success: "bg-success",
  } as const;
  return <span className={`size-2 shrink-0 rounded-full ${map[couleur]}`} />;
}

export function BottomNav({ actif }: { actif: "jeu" | "revelation" | "historique" }) {
  const items = [
    { id: "jeu", label: "Jouer", to: "/jeu" },
    { id: "revelation", label: "Révélation", to: "/revelation" },
    { id: "historique", label: "Historique", to: "/historique" },
  ] as const;
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-3 gap-1 border-t border-border/60 bg-background/95 px-3 pb-6 pt-2 backdrop-blur">
      {items.map((i) => (
        <Link
          key={i.id}
          to={i.to}
          className={`rounded-lg py-2 text-center text-xs font-medium ${
            actif === i.id ? "bg-surface text-primary" : "text-muted-foreground"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
