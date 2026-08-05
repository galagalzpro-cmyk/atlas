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
type Topic = "work" | "anxiety" | "sadness" | "anger" | "decision" | "digital" | "general";
type QuestionKey =
  | "impact"
  | "origin"
  | "duration"
  | "trigger"
  | "need"
  | "obstacle"
  | "support"
  | "control"
  | "boundary"
  | "desiredChange"
  | "options"
  | "fear"
  | "value"
  | "reversibility"
  | "nextEvent"
  | "smallStep";

interface AudienceVersions {
  adult: string;
  adolescent: string;
  senior: string;
}

const QUESTION_BANK: Record<QuestionKey, AudienceVersions> = {
  impact: {
    adult: "Qu’est-ce qui vous affecte le plus aujourd’hui ?",
    adolescent: "C’est quoi le plus dur aujourd’hui ?",
    senior: "Qu’est-ce qui vous pèse le plus aujourd’hui ?",
  },
  origin: {
    adult: "À quel moment avez-vous senti que la situation commençait vraiment à changer ?",
    adolescent: "Tu te souviens du moment où ça a vraiment commencé à changer ?",
    senior: "À quel moment la situation a-t-elle commencé à devenir difficile ?",
  },
  duration: {
    adult: "Depuis quand cela prend-il autant de place ?",
    adolescent: "Depuis quand ça te prend autant la tête ?",
    senior: "Depuis quand cette situation vous préoccupe-t-elle ?",
  },
  trigger: {
    adult: "Qu’est-ce qui déclenche le plus souvent cette montée de tension ?",
    adolescent: "Qu’est-ce qui fait monter la tension le plus vite ?",
    senior: "Qu’est-ce qui augmente le plus votre inquiétude ?",
  },
  need: {
    adult: "De quoi auriez-vous besoin pour vous sentir un peu moins seul face à cela ?",
    adolescent: "De quoi tu aurais besoin pour te sentir moins seul avec ça ?",
    senior: "De quoi auriez-vous le plus besoin aujourd’hui ?",
  },
  obstacle: {
    adult: "Qu’est-ce qui vous empêche le plus d’avancer aujourd’hui ?",
    adolescent: "Qu’est-ce qui te bloque le plus aujourd’hui ?",
    senior: "Qu’est-ce qui vous empêche d’avancer pour le moment ?",
  },
  support: {
    adult: "Y a-t-il quelqu’un avec qui vous vous sentez suffisamment en confiance pour en parler ?",
    adolescent: "Est-ce qu’il y a quelqu’un avec qui tu te sens assez en confiance pour en parler ?",
    senior: "Y a-t-il une personne de confiance que vous pourriez joindre ?",
  },
  control: {
    adult: "Qu’est-ce qui reste encore sous votre contrôle, même un peu ?",
    adolescent: "Qu’est-ce que tu peux encore décider toi-même, même un peu ?",
    senior: "Qu’est-ce que vous pouvez encore décider vous-même ?",
  },
  boundary: {
    adult: "Quelle limite aurait besoin d’être respectée maintenant ?",
    adolescent: "Quelle limite devrait être respectée maintenant ?",
    senior: "Quelle limite devrait être respectée dans cette situation ?",
  },
  desiredChange: {
    adult: "Qu’aimeriez-vous voir changer en premier ?",
    adolescent: "Tu voudrais que quoi change en premier ?",
    senior: "Qu’aimeriez-vous voir changer en premier lieu ?",
  },
  options: {
    adult: "Quelles possibilités restent réellement ouvertes ?",
    adolescent: "Quelles possibilités sont encore vraiment ouvertes ?",
    senior: "Quelles possibilités sont encore disponibles ?",
  },
  fear: {
    adult: "Qu’est-ce que vous craignez le plus de regretter ?",
    adolescent: "Qu’est-ce que tu aurais le plus peur de regretter ?",
    senior: "Qu’est-ce que vous craignez le plus de regretter ?",
  },
  value: {
    adult: "Qu’est-ce qui compte le plus pour vous dans cette décision ?",
    adolescent: "Qu’est-ce qui compte vraiment pour toi dans ce choix ?",
    senior: "Qu’est-ce qui compte le plus pour vous dans ce choix ?",
  },
  reversibility: {
    adult: "Quelle option vous laisserait le plus de possibilités de revenir en arrière ?",
    adolescent: "Quel choix te laisserait le plus facilement changer d’avis ensuite ?",
    senior: "Quelle possibilité serait la plus facile à modifier ensuite ?",
  },
  nextEvent: {
    adult: "Qu’est-ce qui s’est passé ensuite ?",
    adolescent: "Et après, qu’est-ce qui s’est passé ?",
    senior: "Que s’est-il passé ensuite ?",
  },
  smallStep: {
    adult: "Quelle petite chose serait supportable aujourd’hui, sans vous demander trop d’effort ?",
    adolescent: "Quelle petite chose serait faisable aujourd’hui sans te demander trop d’énergie ?",
    senior: "Quelle petite action serait possible aujourd’hui, sans trop d’effort ?",
  },
};

const QUESTION_ORDER: Record<Topic, QuestionKey[]> = {
  work: ["impact", "duration", "obstacle", "control", "need", "support", "desiredChange", "smallStep"],
  anxiety: ["impact", "trigger", "duration", "control", "support", "need", "smallStep"],
  sadness: ["impact", "duration", "support", "need", "desiredChange", "smallStep"],
  anger: ["impact", "trigger", "boundary", "desiredChange", "control", "smallStep"],
  decision: ["options", "fear", "value", "reversibility", "obstacle", "smallStep"],
  digital: ["impact", "control", "boundary", "desiredChange", "smallStep"],
  general: ["impact", "origin", "nextEvent", "need", "obstacle", "support", "desiredChange", "smallStep"],
};

const QUESTION_MARKERS: Record<QuestionKey, string[]> = {
  impact: ["affecte le plus", "le plus dur aujourd'hui", "le plus dur aujourd’hui", "pèse le plus aujourd'hui", "pèse le plus aujourd’hui"],
  origin: ["moment où", "moment la situation", "commençait vraiment", "commencé à devenir"],
  duration: ["depuis quand"],
  trigger: ["déclenche le plus", "fait monter la tension", "augmente le plus"],
  need: ["de quoi auriez-vous", "de quoi tu aurais", "de quoi auriez vous"],
  obstacle: ["empêche le plus", "bloque le plus", "empêche d'avancer", "empêche d’avancer"],
  support: ["quelqu'un avec qui", "quelqu’un avec qui", "personne de confiance"],
  control: ["sous votre contrôle", "décider toi-même", "décider vous-même"],
  boundary: ["quelle limite"],
  desiredChange: ["changer en premier"],
  options: ["possibilités restent", "possibilités sont encore"],
  fear: ["peur de regretter", "craignez le plus de regretter"],
  value: ["compte le plus", "compte vraiment"],
  reversibility: ["revenir en arrière", "changer d'avis", "changer d’avis", "facile à modifier"],
  nextEvent: ["passé ensuite", "et après"],
  smallStep: ["petite chose", "petite action"],
};

function includesAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value));
}

function forAudience(audience: AtlasAudience, versions: AudienceVersions): string {
  if (audience === "adolescent") return versions.adolescent;
  if (audience === "senior") return versions.senior;
  return versions.adult;
}

function reply(text: string, _mode: DialogueMode, nextStep = ""): AtlasReply {
  return {
    text: text.trim(),
    nextStep,
    labels: [],
  };
}

function userTurns(history: AtlasConversationTurn[]): AtlasConversationTurn[] {
  return history.filter((turn) => turn.role === "user");
}

function assistantTranscript(history: AtlasConversationTurn[]): string {
  return history
    .filter((turn) => turn.role === "assistant")
    .map((turn) => turn.text.toLowerCase())
    .join(" ");
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractQuestions(history: AtlasConversationTurn[]): Set<string> {
  const questions = history
    .filter((turn) => turn.role === "assistant")
    .flatMap((turn) => turn.text.split(/(?<=[?])/g))
    .filter((part) => part.includes("?"))
    .map(normalizeQuestion)
    .filter(Boolean);
  return new Set(questions);
}

function questionKeyWasAsked(history: AtlasConversationTurn[], key: QuestionKey): boolean {
  const transcript = assistantTranscript(history);
  return QUESTION_MARKERS[key].some((marker) => transcript.includes(marker));
}

function questionTextWasAsked(history: AtlasConversationTurn[], question: string): boolean {
  return extractQuestions(history).has(normalizeQuestion(question));
}

function chooseQuestion(topic: Topic, audience: AtlasAudience, history: AtlasConversationTurn[]): string {
  const primary = QUESTION_ORDER[topic];
  const secondary = QUESTION_ORDER.general;
  const keys = [...new Set([...primary, ...secondary])];

  for (const key of keys) {
    const question = forAudience(audience, QUESTION_BANK[key]);
    if (!questionKeyWasAsked(history, key) && !questionTextWasAsked(history, question)) return question;
  }

  const openQuestions = audience === "adolescent"
    ? [
      "Qu’est-ce que tu n’as pas encore réussi à dire là-dessus ?",
      "Qu’est-ce qui te vient maintenant, sans chercher la bonne réponse ?",
      "Tu veux continuer à partir de quel point ?",
    ]
    : audience === "senior"
      ? [
        "Y a-t-il un point important que nous n’avons pas encore abordé ?",
        "Qu’aimeriez-vous ajouter maintenant ?",
        "Sur quel point souhaitez-vous continuer ?",
      ]
      : [
        "Qu’est-ce que vous n’avez pas encore réussi à dire là-dessus ?",
        "Qu’est-ce qui vous vient maintenant, sans chercher à l’organiser ?",
        "À partir de quel point souhaitez-vous continuer ?",
      ];

  return openQuestions.find((question) => !questionTextWasAsked(history, question)) ?? openQuestions[history.length % openQuestions.length];
}

function detectTopic(text: string): Topic | null {
  const lower = text.toLowerCase();
  if (includesAny(lower, ["choisir", "décider", "décision", "hésite", "hésitation", "deux options", "quoi faire", "que faire"])) return "decision";
  if (includesAny(lower, ["travail", "boulot", "école", "cours", "charge", "débordé", "débordée", "pression professionnelle", "burn out", "burn-out"])) return "work";
  if (includesAny(lower, ["peur", "angoiss", "stress", "panique", "inquiet", "inquiète", "anxieux", "anxieuse"])) return "anxiety";
  if (includesAny(lower, ["triste", "seul", "seule", "solitude", "vide", "pleure", "pleurer", "découragé", "découragée"])) return "sadness";
  if (includesAny(lower, ["colère", "énervé", "énervée", "rage", "injuste", "injustice", "conflit", "dispute"])) return "anger";
  if (includesAny(lower, ["intelligence artificielle", "algorithme", "automatisation", "réseaux sociaux", "téléphone", "écran", "numérique", "chatbot"])) return "digital";
  return null;
}

function conversationTopic(text: string, history: AtlasConversationTurn[]): Topic {
  const current = detectTopic(text);
  if (current) return current;
  const previousUserText = userTurns(history).map((turn) => turn.text).join(" ");
  return detectTopic(previousUserText) ?? "general";
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
    "je l'ai déjà dit",
    "je l’ai déjà dit",
    "je viens de le dire",
    "pourquoi tu redemandes",
    "pourquoi vous redemandez",
    "laisse tomber",
  ]);
}

function wantsListeningOnly(text: string): boolean {
  return includesAny(text, [
    "je veux juste parler",
    "j'ai juste besoin de parler",
    "j’ai juste besoin de parler",
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
  return /^(merci|d'accord|d’accord|ok|okay|très bien|ça marche|ca marche|oui|non)[.! ]*$/i.test(text.trim());
}

function lead(topic: Topic, audience: AtlasAudience, history: AtlasConversationTurn[]): string {
  const depth = userTurns(history).length;
  const index = depth % 3;
  const versions: Record<Topic, AudienceVersions[]> = {
    work: [
      { adult: "Je vous suis.", adolescent: "Je te suis.", senior: "Je vous suis." },
      { adult: "D’accord, continuons.", adolescent: "D’accord, on continue.", senior: "D’accord, continuons calmement." },
      { adult: "On peut avancer à partir de là.", adolescent: "On peut avancer à partir de là.", senior: "Nous pouvons avancer à partir de là." },
    ],
    anxiety: [
      { adult: "Je reste avec vous là-dessus.", adolescent: "Je reste avec toi là-dessus.", senior: "Je reste avec vous sur ce point." },
      { adult: "Prenons cela sans nous précipiter.", adolescent: "On va prendre ça sans se précipiter.", senior: "Prenons cela calmement." },
      { adult: "D’accord, je vous suis.", adolescent: "D’accord, je te suis.", senior: "D’accord, je vous suis." },
    ],
    sadness: [
      { adult: "Je suis là.", adolescent: "Je suis là.", senior: "Je suis là avec vous." },
      { adult: "Vous pouvez continuer.", adolescent: "Tu peux continuer.", senior: "Vous pouvez continuer à votre rythme." },
      { adult: "Je vous écoute.", adolescent: "Je t’écoute.", senior: "Je vous écoute." },
    ],
    anger: [
      { adult: "D’accord.", adolescent: "D’accord.", senior: "D’accord." },
      { adult: "Je vous suis.", adolescent: "Je te suis.", senior: "Je vous suis." },
      { adult: "On peut rester sur ce point.", adolescent: "On peut rester là-dessus.", senior: "Nous pouvons rester sur ce point." },
    ],
    decision: [
      { adult: "On n’a pas besoin de trancher tout de suite.", adolescent: "Pas besoin de choisir tout de suite.", senior: "Nous n’avons pas besoin de décider immédiatement." },
      { adult: "Prenons la décision par étapes.", adolescent: "On va prendre le choix étape par étape.", senior: "Prenons cette décision par étapes." },
      { adult: "Je vous suis.", adolescent: "Je te suis.", senior: "Je vous suis." },
    ],
    digital: [
      { adult: "Je vous suis.", adolescent: "Je te suis.", senior: "Je vous suis." },
      { adult: "L’enjeu est de vous redonner une marge de choix.", adolescent: "L’idée, c’est de te redonner du choix.", senior: "L’objectif est de vous redonner davantage de contrôle." },
      { adult: "Continuons à partir de là.", adolescent: "On continue à partir de là.", senior: "Continuons à partir de là." },
    ],
    general: [
      { adult: "Je vous suis.", adolescent: "Je te suis.", senior: "Je vous suis." },
      { adult: "D’accord, continuons.", adolescent: "D’accord, on continue.", senior: "D’accord, continuons." },
      { adult: "Vous pouvez poursuivre.", adolescent: "Tu peux continuer.", senior: "Vous pouvez poursuivre à votre rythme." },
    ],
  };
  return forAudience(audience, versions[topic][index]);
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
  const topic = conversationTopic(text, history);
  const question = chooseQuestion(topic, audience, history);
  const hasHistory = userTurns(history).length > 0;

  if (isRepairRequest(lower)) {
    return reply(
      forAudience(audience, {
        adult: "Vous avez raison. Je garde ce que vous avez déjà expliqué et je ne vous le redemanderai pas. Corrigez seulement le point où je suis parti dans la mauvaise direction.",
        adolescent: "Tu as raison. Je garde ce que tu as déjà expliqué et je ne vais pas te le redemander. Corrige juste le point où je suis parti à côté.",
        senior: "Vous avez raison. Je conserve ce que vous avez déjà expliqué. Corrigez seulement le point que j’ai mal compris.",
      }),
      "repair",
    );
  }

  if (wantsListeningOnly(lower)) {
    return reply(
      `${forAudience(audience, {
        adult: "D’accord. Je ne vais pas chercher une solution tout de suite.",
        adolescent: "D’accord. Pas de solution tout de suite.",
        senior: "D’accord. Je vais simplement vous écouter.",
      })} ${question}`,
      "listen",
    );
  }

  if (!hasHistory && isGreeting(text)) {
    return reply(
      forAudience(audience, {
        adult: "Bonjour. Prenez votre temps. Qu’est-ce qui vous amène aujourd’hui ?",
        adolescent: "Salut. Tu peux commencer comme tu veux. Qu’est-ce qui se passe ?",
        senior: "Bonjour. Prenons le temps. Qu’est-ce qui vous préoccupe aujourd’hui ?",
      }),
      "welcome",
    );
  }

  if (includesAny(lower, ["je ne sais pas", "aucune idée", "j'arrive pas à répondre", "j’arrive pas à répondre", "je n'arrive pas à répondre", "je n’arrive pas à répondre"])) {
    const nextQuestion = chooseQuestion(topic, audience, history);
    return reply(
      `${forAudience(audience, {
        adult: "On peut laisser cette question de côté. Vous n’avez pas besoin de forcer une réponse.",
        adolescent: "On peut laisser cette question de côté. Pas besoin de forcer une réponse.",
        senior: "Nous pouvons laisser cette question de côté. Vous n’avez pas besoin de chercher une réponse tout de suite.",
      })} ${nextQuestion}`,
      "listen",
    );
  }

  if (hasHistory && (isAcknowledgement(lower) || isGreeting(text))) {
    return reply(`${lead(topic, audience, history)} ${question}`, "listen");
  }

  if (hasHistory && wordCount(text) <= 8) {
    return reply(`${lead(topic, audience, history)} ${question}`, "clarify");
  }

  if (asksForAdvice(lower)) {
    const adviceLead = forAudience(audience, {
      adult: "Je peux vous aider à avancer sans décider à votre place.",
      adolescent: "Je peux t’aider à avancer sans choisir à ta place.",
      senior: "Je peux vous aider à avancer sans décider à votre place.",
    });
    return reply(`${adviceLead} ${question}`, "decide");
  }

  return reply(`${lead(topic, audience, history)} ${question}`, topic === "decision" ? "decide" : "listen");
}
