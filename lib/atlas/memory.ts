import type { AtlasConversationTurn } from "./conversation";

export interface AtlasConversationMemory {
  facts: string[];
  corrections: string[];
  refusals: string[];
  preferences: string[];
  unresolvedTopics: string[];
  askedQuestions: string[];
  lastUserMessage: string;
  turnCount: number;
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

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractQuestions(text: string): string[] {
  return text
    .split(/(?<=[?])/g)
    .map((part) => part.trim())
    .filter((part) => part.includes("?"));
}

function isCorrection(text: string): boolean {
  const value = normalize(text);
  return [
    "ce n est pas",
    "c est pas",
    "tu as mal compris",
    "vous avez mal compris",
    "je voulais dire",
    "en fait",
    "correction",
  ].some((marker) => value.includes(marker));
}

function isRefusal(text: string): boolean {
  const value = normalize(text);
  return [
    "je ne veux pas en parler",
    "je veux pas en parler",
    "je prefere ne pas repondre",
    "je ne sais pas",
    "laisse cette question",
    "on peut laisser ca",
  ].some((marker) => value.includes(marker));
}

function isPreference(text: string): boolean {
  const value = normalize(text);
  return [
    "je prefere",
    "je veux juste parler",
    "pas de conseil",
    "tutoie moi",
    "vouvoyez moi",
    "reponses courtes",
    "reponses longues",
  ].some((marker) => value.includes(marker));
}

function factCandidate(text: string): boolean {
  const value = normalize(text);
  if (value.length < 12) return false;
  return /\b(je suis|j ai|je vis|je travaille|j habite|mon|ma|mes|depuis|avec)\b/.test(value);
}

export function buildConversationMemory(history: AtlasConversationTurn[], currentText = ""): AtlasConversationMemory {
  const turns = currentText
    ? [...history, { role: "user" as const, text: currentText }]
    : history;
  const users = turns.filter((turn) => turn.role === "user");
  const assistants = turns.filter((turn) => turn.role === "assistant");

  const facts = users.filter((turn) => factCandidate(turn.text) && !isCorrection(turn.text)).map((turn) => turn.text.trim());
  const corrections = users.filter((turn) => isCorrection(turn.text)).map((turn) => turn.text.trim());
  const refusals = users.filter((turn) => isRefusal(turn.text)).map((turn) => turn.text.trim());
  const preferences = users.filter((turn) => isPreference(turn.text)).map((turn) => turn.text.trim());
  const askedQuestions = assistants.flatMap((turn) => extractQuestions(turn.text));

  const unresolvedTopics = users
    .slice(-6)
    .map((turn) => turn.text.trim())
    .filter((text) => text.length > 20)
    .slice(-3);

  return {
    facts: unique(facts).slice(-12),
    corrections: unique(corrections).slice(-8),
    refusals: unique(refusals).slice(-8),
    preferences: unique(preferences).slice(-8),
    unresolvedTopics: unique(unresolvedTopics),
    askedQuestions: unique(askedQuestions).slice(-20),
    lastUserMessage: users.at(-1)?.text ?? "",
    turnCount: users.length,
  };
}

export function describeConversationMemory(memory: AtlasConversationMemory): string {
  const lines = [
    `Nombre de prises de parole de la personne : ${memory.turnCount}.`,
    memory.facts.length ? `Éléments déjà donnés à ne pas redemander : ${memory.facts.join(" | ")}` : "",
    memory.corrections.length ? `Corrections à respecter en priorité : ${memory.corrections.join(" | ")}` : "",
    memory.refusals.length ? `Sujets ou questions laissés de côté : ${memory.refusals.join(" | ")}` : "",
    memory.preferences.length ? `Préférences conversationnelles exprimées : ${memory.preferences.join(" | ")}` : "",
    memory.askedQuestions.length ? `Questions déjà posées, à ne pas répéter : ${memory.askedQuestions.join(" | ")}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}
