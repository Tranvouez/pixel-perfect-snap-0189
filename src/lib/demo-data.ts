// Données de démonstration — remplacées plus tard par Lovable Cloud (base + temps réel).

export type Team = { id: string; nom: string; couleur: "primary" | "accent" | "success" };

export type Joueur = {
  id: string;
  pseudo: string;
  teamId: string;
  enLigne: boolean;
};

export type Secret = {
  id: string;
  texte: string;
  /** null = faux secret */
  proprietaireId: string | null;
  /** réponses des joueurs : joueurId -> joueur désigné */
  reponses: Record<string, string>;
  revele: boolean;
};

export type Pool = {
  id: string;
  nom: string;
  statut: "a_venir" | "en_cours" | "verrouille" | "termine";
  joueurIds: string[];
  secrets: Secret[];
};

export type Soiree = {
  id: string;
  nom: string;
  code: string;
  lieu: string;
  teams: Team[];
  joueurs: Joueur[];
  pools: Pool[];
};

export const TEAMS: Team[] = [
  { id: "t1", nom: "Les Vins", couleur: "primary" },
  { id: "t2", nom: "La Scène", couleur: "accent" },
  { id: "t3", nom: "Le Comptoir", couleur: "success" },
];

export const JOUEURS: Joueur[] = [
  { id: "j1", pseudo: "Camille", teamId: "t1", enLigne: true },
  { id: "j2", pseudo: "Yassine", teamId: "t2", enLigne: true },
  { id: "j3", pseudo: "Mélissa", teamId: "t3", enLigne: true },
  { id: "j4", pseudo: "Théo", teamId: "t1", enLigne: true },
  { id: "j5", pseudo: "Nina", teamId: "t2", enLigne: false },
  { id: "j6", pseudo: "Romy", teamId: "t3", enLigne: true },
  { id: "j7", pseudo: "Sofiane", teamId: "t1", enLigne: true },
];

function reponses(vrai: string | null, justes: number, total: number): Record<string, string> {
  const out: Record<string, string> = {};
  const autres = JOUEURS.filter((j) => j.id !== vrai);
  JOUEURS.slice(0, total).forEach((j, i) => {
    out[j.id] = i < justes && vrai ? vrai : (autres[i % autres.length]?.id ?? "j1");
  });
  return out;
}

export const SOIREE: Soiree = {
  id: "s1",
  nom: "Afterwork du jeudi",
  code: "A7K9",
  lieu: "Le Salon M",
  teams: TEAMS,
  joueurs: JOUEURS,
  pools: [
    {
      id: "p1",
      nom: "Pool 1 · Les Vins",
      statut: "termine",
      joueurIds: ["j1", "j2", "j3", "j4", "j5", "j6", "j7"],
      secrets: [
        {
          id: "s1a",
          texte: "A déjà organisé un mariage dans son appartement.",
          proprietaireId: "j2",
          reponses: reponses("j2", 4, 7),
          revele: true,
        },
        {
          id: "s1b",
          texte: "A dormi une nuit entière dans un aéroport par choix.",
          proprietaireId: "j6",
          reponses: reponses("j6", 5, 7),
          revele: true,
        },
        {
          id: "s1c",
          texte: "A tenté de soudoyer un videur avec un simple espresso.",
          proprietaireId: null,
          reponses: reponses(null, 0, 7),
          revele: true,
        },
        {
          id: "s1d",
          texte: "Connaît par cœur toutes les répliques d'un film de 1998.",
          proprietaireId: "j1",
          reponses: reponses("j1", 2, 7),
          revele: true,
        },
      ],
    },
    {
      id: "p2",
      nom: "Pool 2 · La Scène",
      statut: "en_cours",
      joueurIds: ["j1", "j2", "j3", "j4", "j5", "j6", "j7"],
      secrets: [
        {
          id: "s2a",
          texte: "A déjà chanté sur scène devant plus de 500 personnes.",
          proprietaireId: "j3",
          reponses: reponses("j3", 3, 5),
          revele: true,
        },
        {
          id: "s2b",
          texte: "Le mensonge du jeudi : porte la même montre depuis 10 ans.",
          proprietaireId: null,
          reponses: reponses(null, 0, 5),
          revele: false,
        },
        {
          id: "s2c",
          texte: "A travaillé six mois dans un bar à cocktails à Lisbonne.",
          proprietaireId: "j7",
          reponses: reponses("j7", 4, 5),
          revele: false,
        },
        {
          id: "s2d",
          texte: "A raté un avion à cause d'un karaoké.",
          proprietaireId: "j4",
          reponses: reponses("j4", 1, 5),
          revele: false,
        },
        {
          id: "s2e",
          texte: "Garde encore son doudou d'enfance dans un tiroir.",
          proprietaireId: "j5",
          reponses: reponses("j5", 2, 5),
          revele: false,
        },
      ],
    },
    {
      id: "p3",
      nom: "Pool 3 · Le Comptoir",
      statut: "a_venir",
      joueurIds: ["j1", "j2", "j3", "j4", "j5", "j6", "j7"],
      secrets: [],
    },
  ],
};

export const JOUEUR_COURANT = "j4";

export function joueur(id: string | null | undefined): Joueur | undefined {
  return JOUEURS.find((j) => j.id === id);
}

export function team(id: string | undefined): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}

export function poolActif(): Pool {
  return SOIREE.pools.find((p) => p.statut === "en_cours") ?? SOIREE.pools[0]!;
}

export function statsSecret(secret: Secret) {
  const total = Object.keys(secret.reponses).length;
  const justes = secret.proprietaireId
    ? Object.values(secret.reponses).filter((r) => r === secret.proprietaireId).length
    : 0;
  const pourcentage = total ? Math.round((justes / total) * 100) : 0;
  return { total, justes, pourcentage };
}

export function statsJoueur(joueurId: string) {
  let repondus = 0;
  let justes = 0;
  for (const pool of SOIREE.pools) {
    for (const s of pool.secrets) {
      if (!s.revele) continue;
      const rep = s.reponses[joueurId];
      if (!rep) continue;
      repondus += 1;
      if (s.proprietaireId && rep === s.proprietaireId) justes += 1;
    }
  }
  return { repondus, justes, pourcentage: repondus ? Math.round((justes / repondus) * 100) : 0 };
}
