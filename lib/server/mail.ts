import "server-only";

interface TransactionalEmailInput {
  to: string;
  subject: string;
  html: string;
}

function parseSender(value: string): { name?: string; email: string } | null {
  const match = value.trim().match(/^(?:(.*?)\s*)?<([^<>\s]+@[^<>\s]+)>$/);
  if (match) {
    const name = match[1]?.trim();
    return { email: match[2], ...(name ? { name } : {}) };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return { email: value.trim() };
  return null;
}

async function sendWithBrevo(input: TransactionalEmailInput, apiKey: string, from: string): Promise<boolean> {
  const sender = parseSender(from);
  if (!sender) return false;

  const messageHeaders: Record<string, string> = {
    idempotencyKey: crypto.randomUUID(),
  };
  if (process.env.ATLAS_EMAIL_SANDBOX === "true") {
    messageHeaders["X-Sib-Sandbox"] = "drop";
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      tags: ["atlas-transactional"],
      headers: messageHeaders,
    }),
    cache: "no-store",
  });
  return response.ok;
}

async function sendWithResend(input: TransactionalEmailInput, apiKey: string, from: string): Promise<boolean> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
    cache: "no-store",
  });
  return response.ok;
}

export function transactionalEmailConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.ATLAS_EMAIL_FROM && (env.BREVO_API_KEY || env.RESEND_API_KEY));
}

export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<boolean> {
  const from = process.env.ATLAS_EMAIL_FROM;
  if (!from) return false;
  if (process.env.BREVO_API_KEY) return sendWithBrevo(input, process.env.BREVO_API_KEY, from);
  if (process.env.RESEND_API_KEY) return sendWithResend(input, process.env.RESEND_API_KEY, from);
  return false;
}
