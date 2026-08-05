import type { AtlasAudience } from "./types";
import type { SafetyAssessment } from "./safety";

export interface AtlasReply {
  text: string;
  nextStep: string;
  labels: string[];
}

export interface AtlasConversationTurn {
  role: "user" | "assistant";
  text: string;
}

type DialogueMode = "welcome" | "listen" | "clarify" | "support" | "decide" | "repair" | "safety";

interface AudienceVersions {
  adult: string;
  adolescent: string;
  senior: string;
}

function includesAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value));
}

function forAudience(audience: AtlasAudience, versions: AudienceVersions): string {
  if (audience === "adolescent") return versions.adolescent;
  if (audience === "senior") return versions.senior;
  return versions.adult;
}

function reply(text: string, mode: DialogueMode, nextStep = ""): AtlasReply {
  return {
    text: text.trim(),
    nextStep,
    labels: [mode],
  };
}

function lastTurn(history: AtlasConversationTurn[], role: AtlasConversationTurn["role"]): AtlasConversationTurn | null {
  return [...history].reverse().find((turn) => turn.role === role) ?? null;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isRepairRequest(text: string): boolean {
  return includesAny(text, [
    "tu ne comprends pas",
    "vous ne comprenez pas",
    "tu m'as mal compris",
    "vous m'avez mal compris",
    "c'est pas ça",
    "ce n'est pas ça",
    "tu es à côté",
    "vous êtes à côté",
    "laisse tomber",
  ]);
}

function wantsListeningOnly(text: string): boolean {
  return includesAny(text, [
    "je veux juste parler",
    "j'ai juste besoin de parler",
    "écoute-moi",
    "écoutez-moi",
    "pas de conseil",
    "je ne veux pas de solution",
    "laisse-moi parler",
    "laissez-moi parler",
  ]);
}

function asksForAdvice(text: string): boolean {
  return includesAny(text, [
    "que faire",
    "quoi faire",
    "tu me conseilles",
    "vous me conseillez",
    "aide-moi à choisir",
    "aidez-moi à choisir",
    "comment je peux",
    "comment puis-je",
  ]);
}

function isGreeting(text: string): boolean {
  return /^(bonjour|bonsoir|salut|hello|coucou)(\s|[.!?]|$)/i.test(text.trim());
}

function isAcknowledgement(text: string): boolean {
  return /^(merci|d'accord|ok|okay|très bien|ça marche|ca marche|oui|non)[.! ]*$/i.test(text.trim());
}

function shortContinuation(text: string, history: AtlasConversationTurn[]): AtlasReply | null {
  if (wordCount(text) > 7 || history.length < 2) return null;
  const previousAssistant = lastTurn(history, "assistant");
  if (!previousAssistant?.text.includes("?")) return null;
  const fragment = text.trim().replace(/[.!?]+$/g, "");
  if (!fragment) return null;
  return reply(
    `D’accord, c’est surtout « ${fragment} » qui ressort. Qu’est-ce qui rend cette partie si difficile en ce moment ?`,
    "clarify",
  );
}

function safetyReply(audience: AtlasAudience, safety: SafetyAssessment): AtlasReply | null {
  if (safety.level === "urgent") {
    return reply(
      forAudience(audience, {
        adult: "Ce que vous décrivez peut correspondre à un danger immédiat. Éloignez-vous de ce qui vous met en danger et contactez maintenant une personne réelle ou les secours de votre pays. Ne restez pas seul.",
        adolescent: "Ce que tu décris peut être un danger immédiat. Va vers un adulte sûr maintenant et contacte les secours de ton pays. Ne reste pas seul.",
        senior: "Votre sécurité passe avant tout. Éloignez-vous du danger et appelez immédiatement une personne de confiance ou les secours de votre pays. Ne restez pas seul.",
      }),
      "safety",
      "Contacter immédiatement une personne réelle ou les secours.",
    );
  }

  if (safety.level === "attention") {
    return reply(
      forAudience(audience, {
        adult: "Ce que vous décrivez touche directement à votre sécurité. Est-ce que vous êtes en sécurité maintenant ?",
        adolescent: "Ce que tu décris est sérieux. Est-ce que tu es avec un adulte sûr maintenant ?",
        senior: "Ce que vous décrivez est sérieux. Êtes-vous en sécurité à cet instant ?",
      }),
      "safety",
    );
  }

  return null;
}

export function buildReply(
  text: string,
  audience: AtlasAudience,
  safety: SafetyAssessment,
  history: AtlasConversationTurn[] = [],
): AtlasReply {
  const safetyResponse = safetyReply(audience, safety);
  if (safetyResponse) return safetyResponse;

  const lower = text.toLowerCase().trim();

  if (isRepairRequest(lower)) {
    return reply(
      forAudience(audience, {
        adult: "Vous avez raison, je suis allé trop vite et je suis probablement parti dans la mauvaise direction. Qu’est-ce que j’ai mal compris ?",
        adolescent: "Tu as raison, je suis parti à côté. Qu’est-ce que j’ai mal compris ?",
        senior: "Vous avez raison, je suis allé trop vite. Qu’est-ce que j’ai mal compris ?",
      }),
      "repair",
    );
  }

  if (wantsListeningOnly(lower)) {
    return reply(
      forAudience(audience, {
        adult: "D’accord. Je ne vais pas chercher à résoudre la situation tout de suite. Qu’est-ce qui vous pèse le plus là, maintenant ?",
        adolescent: "D’accord. Pas de solution tout de suite, je t’écoute. C’est quoi le plus lourd là, maintenant ?",
        senior: "D’accord. Je vais simplement vous écouter. Qu’est-ce qui vous pèse le plus aujourd’hui ?",
      }),
      "listen",
    );
  }

  if (isGreeting(text)) {
    return reply(
      forAudience(audience, {
        adult: "Bonjour. Prenez votre temps. Qu’est-ce qui vous amène aujourd’hui ?",
        adolescent: "Salut. Tu peux commencer comme tu veux. Qu’est-ce qui se passe ?",
        senior: "Bonjour. Prenons le temps. Qu’est-ce qui vous préoccupe aujourd’hui ?",
      }),
      "welcome",
    );
  }

  if (isAcknowledgement(lower)) {
    return reply(
      forAudience(audience, {
        adult: "Je suis là. Vous voulez continuer sur ce point, ou revenir à ce qui vous a amené au départ ?",
        adolescent: "Je suis là. Tu veux continuer là-dessus, ou revenir à ce qui t’a amené ?",
        senior: "Je suis là. Souhaitez-vous continuer sur ce point ?",
      }),
      "listen",
    );
  }

  if (includesAny(lower, ["je ne sais pas", "aucune idée", "j'arrive pas à répondre", "je n'arrive pas à répondre"])) {
    return reply(
      forAudience(audience, {
        adult: "Ce n’est pas grave de ne pas savoir tout de suite. Est-ce que cela ressemble davantage à de la pression, de la peur ou un conflit ?",
        adolescent: "Pas besoin d’avoir la bonne réponse. C’est plutôt de la pression, de la peur ou un conflit ?",
        senior: "Ce n’est pas grave. Est-ce surtout de la fatigue, de l’inquiétude ou une difficulté avec quelqu’un ?",
      }),
      "clarify",
    );
  }

  const continuation = shortContinuation(text, history);
  if (continuation) {
    if (audience === "adolescent") {
      continuation.text = continuation.text.replace("Qu’est-ce qui rend cette partie si difficile en ce moment ?", "Qu’est-ce qui rend ça si dur en ce moment ?");
    }
    if (audience === "senior") {
      continuation.text = continuation.text.replace("D’accord, c’est surtout", "Je comprends. C’est surtout");
    }
    return continuation;
  }

  if (includesAny(lower, ["travail", "boulot", "école", "cours", "charge", "débordé", "débordée", "pression", "burn out", "burn-out"])) {
    return reply(
      forAudience(audience, {
        adult: "Ça a l’air de vous prendre beaucoup de place. Qu’est-ce qui vous pèse le plus : la quantité à faire, la peur de ne pas y arriver, ou le fait de devoir tout porter seul ?",
        adolescent: "Ça a l’air vraiment lourd. C’est quoi le pire : la quantité à faire, la peur de décevoir, ou quelqu’un qui te met la pression ?",
        senior: "Cela semble vous fatiguer beaucoup. Quelle est la chose la plus difficile aujourd’hui ?",
      }),
      "support",
    );
  }

  if (includesAny(lower, ["peur", "angoiss", "stress", "panique", "inquiet", "inquiète", "anxieux", "anxieuse"])) {
    return reply(
      forAudience(audience, {
        adult: "On sent que cette peur prend beaucoup de place. Qu’est-ce qui est le plus difficile : ce qui se passe réellement maintenant, ou ce que vous craignez qu’il arrive ?",
        adolescent: "Ça a l’air de te prendre toute la tête. Le plus dur, c’est ce qui se passe maintenant ou ce que tu as peur qu’il arrive ?",
        senior: "Cette inquiétude semble très présente. Quel est le fait précis qui vous préoccupe le plus ?",
      }),
      "support",
    );
  }

  if (includesAny(lower, ["triste", "seul", "seule", "solitude", "vide", "pleure", "pleurer", "découragé", "découragée"])) {
    return reply(
      forAudience(audience, {
        adult: "Ça semble très lourd à porter, surtout si vous gardez tout cela pour vous. De quoi auriez-vous le plus besoin maintenant : être écouté, être soutenu concrètement, ou ne pas rester seul ?",
        adolescent: "Ça a l’air vraiment dur à garder pour toi. Tu aurais surtout besoin qu’on t’écoute, qu’on t’aide, ou que quelqu’un reste avec toi ?",
        senior: "La solitude peut peser très lourd. De quoi auriez-vous le plus besoin aujourd’hui ?",
      }),
      "listen",
    );
  }

  if (includesAny(lower, ["colère", "énervé", "énervée", "rage", "injuste", "injustice", "conflit", "dispute"])) {
    return reply(
      forAudience(audience, {
        adult: "Votre colère semble dire qu’une limite a été franchie. Quel moment précis vous a le plus atteint ?",
        adolescent: "Ta colère a sûrement une raison. C’est quoi le moment exact où ça a basculé ?",
        senior: "Cette situation vous a profondément contrarié. Qu’est-ce qui a été dit ou fait exactement ?",
      }),
      "clarify",
    );
  }

  if (asksForAdvice(lower) || includesAny(lower, ["choisir", "décider", "décision", "hésite", "hésitation", "deux options"])) {
    return reply(
      forAudience(audience, {
        adult: "On peut regarder cela sans vous pousser à décider trop vite. Entre les options possibles, laquelle vous ferait le plus peur de regretter ?",
        adolescent: "On peut poser les choses sans te forcer à choisir tout de suite. Quelle option te ferait le plus peur de regretter ?",
        senior: "Nous pouvons comparer calmement les possibilités. Laquelle vous inquiète le plus ?",
      }),
      "decide",
    );
  }

  if (includesAny(lower, ["intelligence artificielle", "algorithme", "automatisation", "réseaux sociaux", "téléphone", "écran", "numérique", "chatbot"])) {
    return reply(
      forAudience(audience, {
        adult: "Vous avez l’air de ne plus vous sentir vraiment maître de cet outil. Qu’est-ce qui vous dérange le plus : ce qu’il décide pour vous, ce qu’il sait de vous, ou le temps qu’il vous prend ?",
        adolescent: "On dirait que cet outil prend trop de place. Le pire, c’est ce qu’il te montre, ce qu’il récupère sur toi, ou le temps qu’il te prend ?",
        senior: "Cet outil semble être devenu envahissant. Quel appareil ou service vous pose le plus de difficulté ?",
      }),
      "clarify",
    );
  }

  const previousUser = lastTurn(history, "user");
  if (previousUser) {
    return reply(
      forAudience(audience, {
        adult: "Je veux être sûr de rester au plus près de ce que vous vivez. Dans ce que vous venez de dire, qu’est-ce qui vous touche le plus ?",
        adolescent: "Je veux pas partir à côté. Dans ce que tu viens de dire, c’est quoi le plus dur ?",
        senior: "Je ne veux pas aller trop vite. Qu’est-ce qui vous pèse le plus dans cette situation ?",
      }),
      "listen",
    );
  }

  return reply(
    forAudience(audience, {
      adult: "Prenez votre temps. Qu’est-ce qui est le plus difficile pour vous dans cette situation ?",
      adolescent: "Tu peux le dire comme ça vient. C’est quoi le plus dur dans cette situation ?",
      senior: "Prenons une chose à la fois. Qu’est-ce qui vous préoccupe le plus ?",
    }),
    "listen",
  );
}
