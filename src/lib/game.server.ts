// Logique serveur uniquement : jamais envoyée au navigateur.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const FAUX = "__faux__";

export function db() {
  return supabaseAdmin;
}

export function verifierAdmin(code: string) {
  const attendu = process.env["ADMIN_CODE"] || "SECRET2026*";
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

export type SecretRow = {
  id: string;
  est_faux: boolean;
  proprietaire_id: string | null;
};
export type ReponseRow = {
  joueur_id: string;
  secret_id: string;
  choix_joueur_id: string | null;
  choix_faux: boolean;
};

export function estJuste(s: SecretRow, r: ReponseRow) {
  if (s.est_faux) return r.choix_faux;
  return !!s.proprietaire_id && !r.choix_faux && r.choix_joueur_id === s.proprietaire_id;
}

export function statsSecret(s: SecretRow, reps: ReponseRow[]) {
  const liste = reps.filter((r) => r.secret_id === s.id);
  const justes = liste.filter((r) => estJuste(s, r)).length;
  return {
    reponses: liste.length,
    justes,
    pourcentage: liste.length ? Math.round((justes / liste.length) * 100) : 0,
  };
}
