// Données locales à CE téléphone (jamais partagées).
import { useEffect, useState } from "react";

const K = {
  soiree: "ss_soiree",
  token: "ss_token",
  pool: "ss_pool",
  admin: "admin_code",
  adminSoiree: "ss_admin_soiree",
} as const;

function get(k: string, session = false) {
  if (typeof window === "undefined") return null;
  return (session ? sessionStorage : localStorage).getItem(k);
}
function set(k: string, v: string | null, session = false) {
  const s = session ? sessionStorage : localStorage;
  if (v === null) s.removeItem(k);
  else s.setItem(k, v);
}

export const session = {
  soiree: () => get(K.soiree),
  setSoiree: (v: string) => set(K.soiree, v),
  token: () => get(K.token),
  setToken: (v: string | null) => set(K.token, v),
  pool: () => get(K.pool),
  setPool: (v: string | null) => set(K.pool, v),
  admin: () => get(K.admin, true),
  setAdmin: (v: string | null) => set(K.admin, v, true),
  adminSoiree: () => get(K.adminSoiree),
  setAdminSoiree: (v: string | null) => set(K.adminSoiree, v),
};

/** Lit une valeur locale après hydratation (évite les écarts serveur/client). */
export function useLocal<T>(lire: () => T): { pret: boolean; valeur: T | null } {
  const [etat, setEtat] = useState<{ pret: boolean; valeur: T | null }>({ pret: false, valeur: null });
  useEffect(() => {
    setEtat({ pret: true, valeur: lire() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return etat;
}
