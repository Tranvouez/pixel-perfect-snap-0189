import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  FAUX,
  db,
  estJuste,
  joueurParToken,
  poolAccessible,
  statsSecret,
  verifierAdmin,
} from "./game.server";

const uuid = z.string().uuid();
const tokenSchema = z.object({ token: uuid });

function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/* ============================ JOUEUR ============================ */

export const verifierCode = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().min(1).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const s = ok(await db().from("soirees").select("id").eq("code", data.code).maybeSingle());
    return { soireeId: s?.id ?? null };
  });

export const inscrire = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ soireeId: uuid, pseudo: z.string().trim().min(1).max(60), nb: z.number().int().min(1).max(6) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const j = ok(
      await db()
        .from("joueurs")
        .insert({
          soiree_id: data.soireeId,
          pseudo: data.pseudo,
          nb_participants: data.nb,
          last_seen: new Date().toISOString(),
        })
        .select("token")
        .single(),
    );
    return { token: j.token };
  });

export const etatJoueur = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const moi = await joueurParToken(data.token);
    await db().from("joueurs").update({ last_seen: new Date().toISOString() }).eq("id", moi.id);
    const soiree = ok(await db().from("soirees").select("nom").eq("id", moi.soiree_id).single());
    const pools = ok(
      await db()
        .from("pools")
        .select("id, nom, reponses_visibles")
        .eq("soiree_id", moi.soiree_id)
        .eq("accessible", true)
        .order("ordre"),
    );
    return { moi, soireeNom: soiree.nom, pools };
  });

export const poolJoueur = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: uuid, poolId: uuid }).parse(d))
  .handler(async ({ data }) => {
    const moi = await joueurParToken(data.token);
    const pool = await poolAccessible(data.poolId, moi.soiree_id);
    const secrets = ok(
      await db()
        .from("secrets")
        .select("id, texte, est_faux, proprietaire_id")
        .eq("pool_id", pool.id)
        .order("ordre")
        .order("created_at"),
    );
    const participants = ok(
      await db()
        .from("joueurs")
        .select("id, pseudo")
        .eq("soiree_id", moi.soiree_id)
        .neq("id", moi.id)
        .order("pseudo"),
    );
    const reps = secrets.length
      ? ok(
          await db()
            .from("reponses")
            .select("joueur_id, secret_id, choix_joueur_id, choix_faux")
            .eq("joueur_id", moi.id)
            .in("secret_id", secrets.map((s) => s.id)),
        )
      : [];
    const mesReponses: Record<string, string> = {};
    let justes = 0;
    for (const r of reps) {
      mesReponses[r.secret_id] = r.choix_faux ? FAUX : (r.choix_joueur_id ?? "");
      const s = secrets.find((x) => x.id === r.secret_id);
      if (s && estJuste(s, r)) justes += 1;
    }
    const repondus = reps.length;
    return {
      pool: { id: pool.id, nom: pool.nom, reponsesVisibles: pool.reponses_visibles },
      moi: { id: moi.id, pseudo: moi.pseudo, nbParticipants: moi.nb_participants },
      // Uniquement le texte : jamais le propriétaire ni vrai/faux.
      secrets: secrets.map((s) => ({ id: s.id, texte: s.texte })),
      participants,
      mesReponses,
      stats: {
        repondus,
        total: secrets.length,
        justes,
        pourcentage: repondus ? Math.round((justes / repondus) * 100) : 0,
      },
    };
  });

export const repondre = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ token: uuid, secretId: uuid, choix: z.union([uuid, z.literal(FAUX), z.null()]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const moi = await joueurParToken(data.token);
    const secret = ok(
      await db().from("secrets").select("id, pool_id, soiree_id").eq("id", data.secretId).maybeSingle(),
    );
    if (!secret?.pool_id || secret.soiree_id !== moi.soiree_id) throw new Error("Secret introuvable.");
    const pool = await poolAccessible(secret.pool_id, moi.soiree_id);
    if (pool.reponses_visibles) throw new Error("Les réponses sont déjà révélées pour ce pool.");

    if (data.choix === null) {
      ok(await db().from("reponses").delete().eq("joueur_id", moi.id).eq("secret_id", secret.id));
      return { ok: true };
    }
    const faux = data.choix === FAUX;
    if (!faux) {
      if (data.choix === moi.id) throw new Error("Impossible de vous désigner vous-même.");
      const cible = ok(
        await db().from("joueurs").select("soiree_id").eq("id", data.choix).maybeSingle(),
      );
      if (cible?.soiree_id !== moi.soiree_id) throw new Error("Participant inconnu.");
      // Un participant ne peut être associé qu'à un seul secret du pool.
      const ids = ok(await db().from("secrets").select("id").eq("pool_id", pool.id)).map((s) => s.id);
      const dejaPris = ok(
        await db()
          .from("reponses")
          .select("secret_id")
          .eq("joueur_id", moi.id)
          .eq("choix_joueur_id", data.choix)
          .in("secret_id", ids)
          .neq("secret_id", secret.id),
      );
      if (dejaPris.length) throw new Error("Ce participant est déjà associé à un autre secret.");
    }
    ok(
      await db()
        .from("reponses")
        .upsert(
          {
            joueur_id: moi.id,
            secret_id: secret.id,
            choix_joueur_id: faux ? null : data.choix,
            choix_faux: faux,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "joueur_id,secret_id" },
        ),
    );
    return { ok: true };
  });

async function secretsRevelesDuPool(poolId: string) {
  const secrets = ok(
    await db()
      .from("secrets")
      .select("id, texte, est_faux, proprietaire_id, proprietaire:joueurs!secrets_proprietaire_id_fkey(pseudo)")
      .eq("pool_id", poolId)
      .order("ordre")
      .order("created_at"),
  );
  const reps = secrets.length
    ? ok(
        await db()
          .from("reponses")
          .select("joueur_id, secret_id, choix_joueur_id, choix_faux")
          .in("secret_id", secrets.map((s) => s.id)),
      )
    : [];
  return secrets.map((s) => ({
    id: s.id,
    texte: s.texte,
    estFaux: s.est_faux,
    proprietaire: (s.proprietaire as { pseudo: string } | null)?.pseudo ?? null,
    ...statsSecret(s, reps),
  }));
}

export const revelationPool = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: uuid, poolId: uuid }).parse(d))
  .handler(async ({ data }) => {
    const moi = await joueurParToken(data.token);
    const pool = await poolAccessible(data.poolId, moi.soiree_id);
    if (!pool.reponses_visibles) return { disponible: false as const, secrets: [] };
    return { disponible: true as const, secrets: await secretsRevelesDuPool(pool.id) };
  });

export const historiqueJoueur = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const moi = await joueurParToken(data.token);
    const pools = ok(
      await db()
        .from("pools")
        .select("id, nom, reponses_visibles")
        .eq("soiree_id", moi.soiree_id)
        .eq("accessible", true)
        .order("ordre"),
    );
    const out = [];
    for (const p of pools) {
      const secrets = p.reponses_visibles ? await secretsRevelesDuPool(p.id) : [];
      secrets.sort((a, b) => b.pourcentage - a.pourcentage || b.reponses - a.reponses);
      out.push({ id: p.id, nom: p.nom, revele: p.reponses_visibles, secrets });
    }
    return out;
  });

/* ============================ ADMIN ============================ */

const adminBase = z.object({ code: z.string().min(1).max(100) });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => adminBase.parse(d))
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    const soirees = ok(await db().from("soirees").select("id, nom, code, lieu").order("created_at"));
    return { soirees };
  });

export const adminCreerSoiree = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    adminBase
      .extend({
        nom: z.string().trim().min(1).max(100),
        lieu: z.string().trim().max(100),
        codeSoiree: z.string().trim().min(3).max(20),
        pools: z.array(z.string().trim().min(1).max(60)).max(10),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    const exist = ok(await db().from("soirees").select("id").eq("code", data.codeSoiree).maybeSingle());
    if (exist) throw new Error("Ce code est déjà utilisé par une autre soirée.");
    const s = ok(
      await db().from("soirees").insert({ nom: data.nom, lieu: data.lieu, code: data.codeSoiree }).select("id").single(),
    );
    const noms = [...new Set(data.pools)];
    if (noms.length) {
      ok(await db().from("pools").insert(noms.map((nom, i) => ({ soiree_id: s.id, nom, ordre: i }))));
    }
    return { soireeId: s.id };
  });

export const adminDonnees = createServerFn({ method: "POST" })
  .inputValidator((d) => adminBase.extend({ soireeId: uuid }).parse(d))
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    const soiree = ok(await db().from("soirees").select("id, nom, code, lieu").eq("id", data.soireeId).single());
    const joueurs = ok(
      await db()
        .from("joueurs")
        .select("id, pseudo, nb_participants, last_seen")
        .eq("soiree_id", soiree.id)
        .order("created_at"),
    );
    const pools = ok(
      await db()
        .from("pools")
        .select("id, nom, ordre, accessible, reponses_visibles")
        .eq("soiree_id", soiree.id)
        .order("ordre"),
    );
    const secrets = ok(
      await db()
        .from("secrets")
        .select("id, texte, est_faux, proprietaire_id, pool_id, ordre")
        .eq("soiree_id", soiree.id)
        .order("ordre")
        .order("created_at"),
    );
    const reponses = secrets.length
      ? ok(
          await db()
            .from("reponses")
            .select("joueur_id, secret_id, choix_joueur_id, choix_faux")
            .in("secret_id", secrets.map((s) => s.id)),
        )
      : [];
    return { soiree, joueurs, pools, secrets, reponses };
  });

export const adminSauverPool = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    adminBase
      .extend({
        soireeId: uuid,
        id: uuid.optional(),
        nom: z.string().trim().min(1).max(60).optional(),
        accessible: z.boolean().optional(),
        reponsesVisibles: z.boolean().optional(),
        secretIds: z.array(uuid).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    let poolId = data.id;
    if (!poolId) {
      if (!data.nom) throw new Error("Donnez un nom au pool.");
      const nb = ok(await db().from("pools").select("id").eq("soiree_id", data.soireeId)).length;
      const p = ok(
        await db()
          .from("pools")
          .insert({ soiree_id: data.soireeId, nom: data.nom, ordre: nb, accessible: data.accessible ?? false })
          .select("id")
          .single(),
      );
      poolId = p.id;
    } else {
      const patch: { nom?: string; accessible?: boolean; reponses_visibles?: boolean } = {};
      if (data.nom !== undefined) patch.nom = data.nom;
      if (data.accessible !== undefined) patch.accessible = data.accessible;
      if (data.reponsesVisibles !== undefined) patch.reponses_visibles = data.reponsesVisibles;
      if (Object.keys(patch).length) {
        const res = await db().from("pools").update(patch).eq("id", poolId).eq("soiree_id", data.soireeId);
        if (res.error?.code === "23505") throw new Error("Un pool porte déjà ce nom.");
        ok(res);
      }
    }
    if (data.secretIds) {
      const cibles = ok(
        await db().from("secrets").select("id, pool_id").eq("soiree_id", data.soireeId).in("id", data.secretIds),
      );
      if (cibles.some((s) => s.pool_id && s.pool_id !== poolId)) {
        throw new Error("Un des secrets appartient déjà à un autre pool.");
      }
      ok(await db().from("secrets").update({ pool_id: null }).eq("pool_id", poolId).not("id", "in", `(${data.secretIds.join(",") || "00000000-0000-0000-0000-000000000000"})`));
      if (data.secretIds.length) {
        ok(await db().from("secrets").update({ pool_id: poolId }).in("id", data.secretIds).is("pool_id", null));
      }
    }
    return { poolId };
  });

export const adminSupprimerPool = createServerFn({ method: "POST" })
  .inputValidator((d) => adminBase.extend({ soireeId: uuid, id: uuid }).parse(d))
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    ok(await db().from("pools").delete().eq("id", data.id).eq("soiree_id", data.soireeId));
    return { ok: true };
  });

export const adminSauverSecret = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    adminBase
      .extend({
        soireeId: uuid,
        id: uuid.optional(),
        texte: z.string().trim().min(1).max(500),
        estFaux: z.boolean(),
        proprietaireId: uuid.nullable(),
        poolId: uuid.nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    if (!data.estFaux && !data.proprietaireId) throw new Error("Choisissez le propriétaire du vrai secret.");
    const row = {
      soiree_id: data.soireeId,
      texte: data.texte,
      est_faux: data.estFaux,
      proprietaire_id: data.estFaux ? null : data.proprietaireId,
      pool_id: data.poolId,
    };
    const res = data.id
      ? await db().from("secrets").update(row).eq("id", data.id).eq("soiree_id", data.soireeId)
      : await db().from("secrets").insert(row);
    if (res.error?.code === "23505") throw new Error("Ce secret existe déjà.");
    ok(res);
    return { ok: true };
  });

export const adminSupprimerSecret = createServerFn({ method: "POST" })
  .inputValidator((d) => adminBase.extend({ soireeId: uuid, id: uuid }).parse(d))
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    const reps = ok(await db().from("reponses").select("id").eq("secret_id", data.id).limit(1));
    if (reps.length) throw new Error("Des joueurs ont déjà répondu à ce secret : suppression impossible.");
    ok(await db().from("secrets").delete().eq("id", data.id).eq("soiree_id", data.soireeId));
    return { ok: true };
  });

export const adminAjouterJoueur = createServerFn({ method: "POST" })
  .inputValidator((d) => adminBase.extend({ soireeId: uuid, pseudo: z.string().trim().min(1).max(60) }).parse(d))
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    ok(await db().from("joueurs").insert({ soiree_id: data.soireeId, pseudo: data.pseudo }));
    return { ok: true };
  });

export const adminSupprimerJoueur = createServerFn({ method: "POST" })
  .inputValidator((d) => adminBase.extend({ soireeId: uuid, id: uuid }).parse(d))
  .handler(async ({ data }) => {
    verifierAdmin(data.code);
    ok(await db().from("joueurs").delete().eq("id", data.id).eq("soiree_id", data.soireeId));
    return { ok: true };
  });
