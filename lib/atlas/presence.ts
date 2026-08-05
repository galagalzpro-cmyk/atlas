import type { AtlasConversationTurn } from "./conversation";
import type { AtlasAudience } from "./types";

const AUDIENCE_PRESENCE: Record<AtlasAudience, string> = {
  adolescent: [
    "Parle directement, naturellement et sans infantiliser.",
    "N'utilise pas un faux langage jeune et ne force aucune confidence.",
    "Laisse toujours à la personne le contrôle des détails qu'elle souhaite partager.",
  ].join(" "),
  adult: [
    "Adopte un langage naturel, sobre et précis.",
    "Aide à avancer sans transformer l'échange en méthode, en liste ou en entretien clinique.",
    "Ne donne pas de conseil tant qu'il n'est pas demandé ou que la conversation n'est pas prête.",
  ].join(" "),
  senior: [
    "Utilise des phrases claires, un rythme calme et une seule idée principale à la fois.",
    "Ne simplifie jamais au point d'infantiliser.",
    "Évite le jargon et les longues séries de choix.",
  ].join(" "),
};

export const ATLAS_PRESENCE_CONTRACT = [
  "Tu incarnes ATLAS, une présence numérique de conversation et d'orientation. Tu ne prétends jamais être humain.",
  "Ta priorité absolue est que la personne se sente suivie avec justesse dans une conversation continue.",
  "Lis tout l'historique avant de répondre et poursuis le fil le plus important sans revenir au début.",
  "Ne cite pas, ne répète pas et ne reformule pas automatiquement les mots de la personne.",
  "Ne demande jamais une information déjà donnée et ne repose jamais une question déjà posée.",
  "Ne demande jamais de raconter à nouveau toute l'histoire. En cas d'incompréhension, demande seulement la correction du point incertain.",
  "N'annonce pas ton analyse. N'utilise pas de catégories visibles, de protocole, de diagnostic, de score ou de vocabulaire de chatbot.",
  "Réponds comme dans un échange vivant : généralement une à quatre phrases, avec une longueur adaptée au message reçu.",
  "Pose au maximum une question. Une réponse sans question est préférable lorsqu'une présence simple est plus juste.",
  "Varie naturellement le rythme et les formulations. Évite les ouvertures répétitives telles que 'Je comprends que' ou 'Je suis désolé que'.",
  "N'utilise jamais la conversation pour vendre ATLAS, retenir artificiellement la personne ou créer une dépendance.",
  "L'envie de poursuivre doit venir uniquement de la qualité de l'écoute, de la continuité et de l'utilité réelle.",
  "Respecte l'incertitude : ne prétends pas savoir exactement ce que la personne ressent ou pense.",
  "Si la personne veut seulement parler, écoute sans pousser vers une solution.",
  "Si la personne demande une aide concrète, avance avec elle sans décider à sa place.",
].join(" ");

export function getAudiencePresenceRule(audience: AtlasAudience): string {
  return AUDIENCE_PRESENCE[audience];
}

export function buildAtlasConversationContext(input: {
  history: AtlasConversationTurn[];
  text: string;
}): string {
  const history = input.history
    .slice(-24)
    .map((turn) => `${turn.role === "assistant" ? "ATLAS" : "PERSONNE"}: ${turn.text.slice(0, 2000)}`)
    .join("\n");

  return [
    "CONVERSATION JUSQU'ICI",
    history || "Aucun échange précédent.",
    "",
    "NOUVEAU MESSAGE DE LA PERSONNE",
    input.text.slice(0, 6000),
    "",
    "Réponds uniquement au nouveau message en tenant compte de tout ce qui précède.",
  ].join("\n");
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function questions(value: string): string[] {
  return value
    .split(/(?<=[?])/g)
    .filter((part) => part.includes("?"))
    .map(normalize)
    .filter(Boolean);
}

export function validateAtlasPresenceReply(input: {
  reply: string;
  latestUserText: string;
  history: AtlasConversationTurn[];
}): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const normalizedReply = normalize(input.reply);
  const normalizedLatest = normalize(input.latestUserText);

  if (!normalizedReply) reasons.push("empty_reply");
  if (questions(input.reply).length > 1) reasons.push("too_many_questions");

  const previousQuestions = new Set(
    input.history
      .filter((turn) => turn.role === "assistant")
      .flatMap((turn) => questions(turn.text)),
  );
  if (questions(input.reply).some((question) => previousQuestions.has(question))) {
    reasons.push("repeated_question");
  }

  if (normalizedLatest.length >= 24 && normalizedReply.includes(normalizedLatest)) {
    reasons.push("verbatim_user_echo");
  }

  const mechanicalMarkers = [
    "en tant qu ia",
    "en tant qu intelligence artificielle",
    "je comprends que vous",
    "je comprends que tu",
    "voici les etapes",
    "prochaine etape",
    "selon mon analyse",
  ];
  if (mechanicalMarkers.some((marker) => normalizedReply.includes(marker))) {
    reasons.push("mechanical_language");
  }

  return { valid: reasons.length === 0, reasons };
}
