// Logique serveur uniquement : jamais envoyée au navigateur.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export { FAUX, estJuste, statsSecret, statsJoueurPool, pct, cleNom } from "./stats";
export type { SecretLite as SecretRow, ReponseLite as ReponseRow } from "./stats";

export function db() {
  return supabaseAdmin;
}

export function verifierAdmin(code: string) {
  let attendu = process.env["ADMIN_CODE"];
  if (!attendu) {
    // Pas de code par défaut en production : ADMIN_CODE est obligatoire.
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("ADMIN_CODE n'est pas configuré sur le serveur.");
    }
    attendu = "SECRET2026*";
  }
  if (code.trim() !== attendu) throw new Error("Code de la Voix incorrect.");
}

export async function joueurParToken(token: string) {
  const { data, error } = await db()
    .from("joueurs")
    .select("id, soiree_id, pseudo, nb_participants")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Joueur introuvable, reconnectez-vous.");
  return data;
}

export async function poolAccessible(poolId: string, soireeId: string) {
  const { data } = await db()
    .from("pools")
    .select("id, nom, accessible, reponses_visibles, soiree_id")
    .eq("id", poolId)
    .maybeSingle();
  if (!data || data.soiree_id !== soireeId || !data.accessible) {
    throw new Error("Ce pool n'est pas accessible.");
  }
  return data;
}
