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

function includesAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value));
}

function audienceReply(
  audience: AtlasAudience,
  adult: AtlasReply,
  adolescent: AtlasReply,
  senior: AtlasReply,
): AtlasReply {
  if (audience === "adolescent") return adolescent;
  if (audience === "senior") return senior;
  return adult;
}

function lastAssistantQuestion(history: AtlasConversationTurn[]): string | null {
  const previous = [...history].reverse().find((turn) => turn.role === "assistant");
  if (!previous) return null;
  const question = previous.text.split(/(?<=[.!?])\s+/).findLast((part) => part.includes("?"));
  return question?.trim() ?? null;
}

export function buildReply(
  text: string,
  audience: AtlasAudience,
  safety: SafetyAssessment,
  history: AtlasConversationTurn[] = [],
): AtlasReply {
  if (safety.level === "urgent") {
    return {
      text: "Ce que vous décrivez peut correspondre à un danger immédiat. ATLAS suspend la conversation ordinaire. Éloignez-vous de ce qui vous met en danger et contactez maintenant une personne réelle ou les secours de votre pays. Ne restez pas seul.",
      nextStep: "Contacter immédiatement une personne réelle ou les secours.",
      labels: ["urgence", "relais humain", "conversation suspendue"],
    };
  }

  if (safety.level === "attention") {
    return audienceReply(
      audience,
      {
        text: "Je repère un niveau de vigilance. Je ne vais pas minimiser ce que vous décrivez. Quel est le fait concret qui doit être sécurisé en premier, et quelle personne réelle pouvez-vous joindre aujourd’hui ?",
        nextStep: "Nommer le risque concret et une personne joignable.",
        labels: ["vigilance", "sécurité", "relais humain"],
      },
      {
        text: "Je prends ce signal au sérieux. Choisissez maintenant un adulte de confiance, présent ou joignable, et dites-lui exactement ce qui vous inquiète. Quel adulte pouvez-vous contacter ?",
        nextStep: "Contacter un adulte sûr maintenant.",
        labels: ["vigilance", "adulte de confiance", "protection"],
      },
      {
        text: "Je prends ce que vous dites au sérieux. Nous allons rester simples. Êtes-vous en sécurité maintenant, et quelle personne pouvez-vous appeler tout de suite ?",
        nextStep: "Appeler une personne de confiance.",
        labels: ["vigilance", "sécurité", "étape unique"],
      },
    );
  }

  const lower = text.toLowerCase().trim();
  const previousQuestion = lastAssistantQuestion(history);

  if (/^(bonjour|bonsoir|salut|hello|coucou)\b/.test(lower)) {
    return audienceReply(
      audience,
      {
        text: "Bonjour. Je suis prêt. Décrivez la situation comme elle vient ; je séparerai les faits, ce que vous ressentez et la décision à préparer.",
        nextStep: "Décrire la situation en quelques phrases.",
        labels: ["accueil", "clarification", "adulte"],
      },
      {
        text: "Salut. Vous pouvez parler franchement et garder pour vous les détails que vous ne voulez pas donner. Qu’est-ce qui s’est passé ?",
        nextStep: "Dire le fait principal.",
        labels: ["accueil", "direct", "contrôle utilisateur"],
      },
      {
        text: "Bonjour. Prenons le temps. Dites-moi seulement ce qui vous préoccupe le plus aujourd’hui.",
        nextStep: "Dire le problème principal en une phrase.",
        labels: ["accueil", "rythme calme", "senior"],
      },
    );
  }

  if (/^(merci|d'accord|ok|très bien|ca marche|ça marche)[.! ]*$/.test(lower)) {
    return audienceReply(
      audience,
      {
        text: "Très bien. Nous pouvons continuer à partir de là. Quel résultat concret voudriez-vous obtenir à la fin de cette conversation ?",
        nextStep: "Nommer le résultat recherché.",
        labels: ["continuité", "objectif", "adulte"],
      },
      {
        text: "D’accord. On continue simplement : qu’est-ce que vous voulez réussir à faire maintenant ?",
        nextStep: "Dire l’objectif immédiat.",
        labels: ["continuité", "direct", "objectif"],
      },
      {
        text: "Très bien. Continuons une étape à la fois. Que souhaitez-vous régler en premier ?",
        nextStep: "Choisir une seule priorité.",
        labels: ["continuité", "étape unique", "priorité"],
      },
    );
  }

  if (includesAny(lower, ["je ne sais pas", "aucune idée", "j'arrive pas à répondre", "je n'arrive pas à répondre"])) {
    return audienceReply(
      audience,
      {
        text: `C’est acceptable de ne pas savoir encore${previousQuestion ? ". Je reformule la question précédente" : ""}. Parmi ces trois options, laquelle ressemble le plus à votre situation : trop de pression, trop d’incertitude, ou un conflit avec quelqu’un ?`,
        nextStep: "Choisir pression, incertitude ou conflit.",
        labels: ["reformulation", "choix limité", "clarification"],
      },
      {
        text: "Pas besoin d’avoir la réponse parfaite. Choisissez juste ce qui ressemble le plus à votre situation : pression, peur ou conflit ?",
        nextStep: "Choisir un seul mot.",
        labels: ["choix simple", "direct", "sans pression"],
      },
      {
        text: "Ce n’est pas grave. Je vais simplifier. Est-ce surtout un problème de fatigue, de peur ou de relation avec une personne ?",
        nextStep: "Choisir fatigue, peur ou relation.",
        labels: ["question simple", "rythme calme", "orientation"],
      },
    );
  }

  if (includesAny(lower, ["travail", "boulot", "charge", "débordé", "débordée", "pression professionnelle", "burn out", "burn-out"])) {
    return audienceReply(
      audience,
      {
        text: "La charge semble être le noyau du problème. Séparons-la en cinq catégories : faire, dire, décider, déléguer et abandonner. Laquelle vous coûte le plus aujourd’hui ?",
        nextStep: "Choisir une catégorie et un seul élément.",
        labels: ["charge", "priorisation", "décision"],
      },
      {
        text: "Vous avez beaucoup de pression. On va faire court : est-ce surtout l’école ou le travail à faire, une personne qui vous met la pression, ou la peur d’échouer ?",
        nextStep: "Choisir la source principale de pression.",
        labels: ["pression", "question directe", "clarification"],
      },
      {
        text: "Vous semblez très chargé. Prenons une seule chose. Quelle tâche doit absolument être faite aujourd’hui ?",
        nextStep: "Nommer une seule tâche prioritaire.",
        labels: ["charge", "une étape", "priorité"],
      },
    );
  }

  if (includesAny(lower, ["peur", "angoiss", "stress", "panique", "inquiet", "inquiète", "anxieux", "anxieuse"])) {
    return audienceReply(
      audience,
      {
        text: "La peur est présente. Restons sur trois repères : ce qui est certain maintenant, ce qui est seulement possible, et la protection disponible dans l’heure. Quel est le fait certain ?",
        nextStep: "Écrire un fait certain, sans interprétation.",
        labels: ["peur", "faits", "protection"],
      },
      {
        text: "Je vois que ça vous fait peur. On ne va pas tout résoudre d’un coup. Qu’est-ce qui est vraiment en train de se passer maintenant, pas ce qui pourrait arriver plus tard ?",
        nextStep: "Dire ce qui se passe maintenant.",
        labels: ["peur", "présent", "direct"],
      },
      {
        text: "Je comprends que cela vous inquiète. Respirons et avançons lentement. Quel est le fait précis qui vous inquiète aujourd’hui ?",
        nextStep: "Dire le fait précis en une phrase.",
        labels: ["inquiétude", "rythme calme", "fait précis"],
      },
    );
  }

  if (includesAny(lower, ["triste", "seul", "seule", "solitude", "vide", "pleure", "pleurer", "découragé", "découragée"])) {
    return audienceReply(
      audience,
      {
        text: "Je repère de la tristesse ou de l’isolement. Avant de chercher une solution, précisons ce qui manque le plus : être compris, retrouver de l’énergie, ou renouer avec quelqu’un ?",
        nextStep: "Choisir le manque principal.",
        labels: ["tristesse", "besoin", "lien"],
      },
      {
        text: "Vous n’avez pas à tout expliquer. Est-ce que vous avez surtout besoin que quelqu’un vous écoute, vous aide concrètement, ou reste avec vous ?",
        nextStep: "Choisir écouter, aider ou rester présent.",
        labels: ["tristesse", "soutien", "choix simple"],
      },
      {
        text: "La solitude peut peser lourd. Restons sur une chose concrète : quelle personne pourrait vous répondre aujourd’hui, même pour quelques minutes ?",
        nextStep: "Choisir une personne à appeler.",
        labels: ["solitude", "contact", "étape unique"],
      },
    );
  }

  if (includesAny(lower, ["colère", "énervé", "énervée", "rage", "injuste", "injustice", "conflit", "dispute"])) {
    return audienceReply(
      audience,
      {
        text: "La colère indique souvent qu’une limite, une attente ou un besoin a été touché. Quel fait précis a déclenché la colère, et quelle limite voudriez-vous poser ?",
        nextStep: "Nommer le déclencheur et la limite.",
        labels: ["colère", "limite", "fait précis"],
      },
      {
        text: "Votre colère a une raison. Dites-moi juste le moment exact où ça a basculé : qu’est-ce que la personne a fait ou dit ?",
        nextStep: "Décrire le déclencheur exact.",
        labels: ["colère", "direct", "déclencheur"],
      },
      {
        text: "Je vois que cette situation vous met en colère. Prenons un fait à la fois. Qu’est-ce qui a été dit ou fait exactement ?",
        nextStep: "Décrire un seul fait.",
        labels: ["colère", "fait unique", "calme"],
      },
    );
  }

  if (includesAny(lower, ["choisir", "décider", "décision", "hésite", "hésitation", "deux options", "quoi faire"])) {
    return audienceReply(
      audience,
      {
        text: "Pour décider, comparons les options sur quatre critères : bénéfice, risque, réversibilité et coût émotionnel. Quelles sont les deux options principales ?",
        nextStep: "Nommer les deux options sans encore les juger.",
        labels: ["décision", "comparaison", "réversibilité"],
      },
      {
        text: "On va éviter de tourner en rond. Quelles sont vos deux vraies options, même si aucune n’est parfaite ?",
        nextStep: "Nommer les deux options.",
        labels: ["décision", "direct", "deux options"],
      },
      {
        text: "Nous allons comparer simplement. Quelles sont les deux possibilités entre lesquelles vous hésitez ?",
        nextStep: "Dire les deux possibilités.",
        labels: ["décision", "comparaison simple", "calme"],
      },
    );
  }

  if (includesAny(lower, ["intelligence artificielle", "algorithme", "automatisation", "réseaux sociaux", "téléphone", "écran", "numérique", "chatbot"])) {
    return audienceReply(
      audience,
      {
        text: "Vous décrivez une perte de contrôle face à un système numérique. Séparons ce que le système décide, ce que vous pouvez régler, et ce que vous pouvez refuser. Quelle action automatique vous gêne le plus ?",
        nextStep: "Nommer une action numérique à reprendre en main.",
        labels: ["contrôle", "numérique", "limites"],
      },
      {
        text: "On va reprendre le contrôle. Qu’est-ce qui vous dérange le plus : ce que l’application vous montre, ce qu’elle collecte, ou le temps qu’elle vous prend ?",
        nextStep: "Choisir affichage, données ou temps.",
        labels: ["contrôle", "numérique", "choix direct"],
      },
      {
        text: "Les outils numériques peuvent devenir envahissants. Quel appareil ou service vous pose le plus de difficulté aujourd’hui ?",
        nextStep: "Nommer un seul appareil ou service.",
        labels: ["autonomie", "numérique", "étape unique"],
      },
    );
  }

  if (audience === "senior") {
    return {
      text: "Nous allons avancer une étape à la fois. Dites-moi d’abord le fait principal, en une phrase courte. Ensuite, nous choisirons l’action suivante.",
      nextStep: "Dire le fait principal en une phrase.",
      labels: ["rythme calme", "voix prioritaire", "orientation"],
    };
  }

  if (audience === "adolescent") {
    return {
      text: "Je vais rester direct. Quel est le fait précis : ce qui s’est passé, où, et qui était présent ? Vous pouvez garder les détails que vous ne voulez pas donner.",
      nextStep: "Décrire uniquement le fait principal.",
      labels: ["mode direct", "contrôle utilisateur", "discret"],
    };
  }

  return {
    text: "Je distingue quatre éléments possibles : un fait, une interprétation, une émotion et un besoin. Quel exemple concret résume le mieux la situation ?",
    nextStep: "Donner un exemple concret et vérifiable.",
    labels: ["clarté", "faits", "besoins"],
  };
}
