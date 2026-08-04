import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  mode: z.enum(["presence", "clarity", "expansion", "resolve"]).default("presence"),
});

function localResponse(message: string, mode: string) {
  const normalized = message.toLowerCase();
  const urgent = /(suicide|me tuer|mourir|danger immédiat|violence maintenant)/i.test(normalized);
  if (urgent) {
    return {
      text: "Je prends ce message au sérieux. Éloignez-vous immédiatement de tout danger, contactez une personne réelle près de vous et appelez les services d’urgence de votre pays. Je reste présent, mais je ne remplace pas une aide humaine immédiate.",
      state: "speaking",
      intensity: 1,
      mode: "resolve",
      safety: "urgent",
    };
  }

  const prefix = mode === "clarity"
    ? "Je vais clarifier la situation avec vous."
    : mode === "expansion"
      ? "Je vais ouvrir plusieurs trajectoires possibles."
      : mode === "resolve"
        ? "Je vais transformer cela en prochaine action concrète."
        : "Je suis présent. Prenons le temps de comprendre ce qui se passe.";

  const question = /travail|projet|décision|choisir/.test(normalized)
    ? "Quel résultat précis souhaitez-vous obtenir, et quelle contrainte vous bloque le plus aujourd’hui ?"
    : /peur|angoisse|stress|pression/.test(normalized)
      ? "Quelle partie est certaine, quelle partie est une anticipation, et de quoi avez-vous besoin maintenant pour retrouver un minimum de stabilité ?"
      : "Quel est le fait principal, ce que vous ressentez, et ce que vous voudriez voir changer en premier ?";

  return {
    text: `${prefix} ${question}`,
    state: "speaking",
    intensity: Math.min(0.95, 0.5 + message.length / 900),
    mode,
    safety: "standard",
  };
}

export async function POST(request: Request) {
  try {
    const body = RequestSchema.parse(await request.json());
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) return NextResponse.json(localResponse(body.message, body.mode));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        store: false,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "Tu es ATLAS, une présence numérique robotique haut de gamme. Réponds en français avec calme, précision et profondeur. Tu aides à clarifier, stabiliser et orienter sans diagnostic médical. Tu ne prétends jamais lire les émotions. En cas de risque immédiat, privilégie la sécurité humaine et les secours. Réponse maximale: 120 mots.",
              },
            ],
          },
          { role: "user", content: [{ type: "input_text", text: body.message }] },
        ],
      }),
    });

    if (!response.ok) return NextResponse.json(localResponse(body.message, body.mode));
    const data = await response.json() as { output_text?: string };
    const text = data.output_text?.trim();
    if (!text) return NextResponse.json(localResponse(body.message, body.mode));

    return NextResponse.json({
      text,
      state: "speaking",
      intensity: Math.min(0.98, 0.56 + body.message.length / 1100),
      mode: body.mode,
      safety: "standard",
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    return NextResponse.json({ error: "ATLAS n’a pas pu traiter la demande." }, { status: 500 });
  }
}
