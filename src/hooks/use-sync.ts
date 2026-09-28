import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Écoute le signal temps réel de la soirée (aucune donnée sensible transmise)
 * et rafraîchit toutes les données affichées dès qu'un changement survient.
 */
export function useSync(soireeId: string | null | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!soireeId) return;
    const channel = supabase
      .channel(`soiree-${soireeId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "soiree_sync", filter: `soiree_id=eq.${soireeId}` },
        () => {
          qc.invalidateQueries();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [soireeId, qc]);
}
