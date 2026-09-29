import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { etatJoueur } from "@/lib/game.functions";
import { session } from "@/lib/session";
import { useSync } from "./use-sync";

/**
 * Session du joueur + pools accessibles + pool sélectionné.
 * - Le pool choisi est mémorisé sur ce téléphone et partagé entre Jouer / Révélation / Historique.
 * - Les pools viennent du serveur (uniquement ceux rendus accessibles par l'admin).
 * - Le ping périodique alimente l'indicateur « en ligne » de l'admin.
 */
export function useJoueur() {
  const navigate = useNavigate();
  const [pret, setPret] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [poolChoisi, setPoolChoisi] = useState<string | null>(null);

  useEffect(() => {
    const t = session.token();
    setToken(t);
    setPoolChoisi(session.pool());
    setPret(true);
    if (!t) navigate({ to: "/" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const etat = useQuery({
    queryKey: ["etat", token],
    enabled: !!token,
    refetchInterval: 20_000,
    retry: false,
    queryFn: () => etatJoueur({ data: { token: token! } }),
  });

  useEffect(() => {
    const msg = etat.error instanceof Error ? etat.error.message : "";
    if (msg.includes("introuvable")) {
      session.setToken(null);
      navigate({ to: "/" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.error]);

  useSync(etat.data?.moi.soiree_id);

  const pools = etat.data?.pools ?? [];
  const pool = pools.find((p) => p.id === poolChoisi) ?? pools[0] ?? null;

  const choisirPool = useCallback((id: string) => {
    setPoolChoisi(id);
    session.setPool(id);
  }, []);

  return {
    token,
    pret,
    chargement: !pret || (!!token && etat.isLoading),
    moi: etat.data?.moi ?? null,
    pools,
    pool,
    choisirPool,
  };
}
