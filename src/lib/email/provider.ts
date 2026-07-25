export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, string>;
};

export interface EmailProvider {
  readonly name: string;
  send(payload: EmailPayload): Promise<{ ok: boolean; messageId?: string }>;
}

class MockEmailProvider implements EmailProvider {
  readonly name = "mock";

  async send(payload: EmailPayload) {
    console.info(`[email:mock] To: ${payload.to} | Subject: ${payload.subject}`);
    return { ok: true, messageId: `mock-${Date.now()}` };
  }
}

class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  async send(payload: EmailPayload) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not configured");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Samsar IA <noreply@samsar.demo>",
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
      }),
    });

    if (!res.ok) throw new Error(`Resend error: ${res.status}`);
    const data = (await res.json()) as { id: string };
    return { ok: true, messageId: data.id };
  }
}

export function createEmailProvider(): EmailProvider {
  if (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
    return new ResendEmailProvider();
  }
  return new MockEmailProvider();
}

export async function sendAlertEmail(to: string, searchName: string, matchCount: number) {
  const provider = createEmailProvider();
  return provider.send({
    to,
    subject: `[Samsar IA] Alerte : ${matchCount} nouveau(x) bien(s) — ${searchName}`,
    body: `Bonjour,\n\nVotre alerte "${searchName}" a trouvé ${matchCount} bien(s) correspondant(s).\n\nConnectez-vous à Samsar IA pour voir les résultats.\n\n— Samsar IA (démo)`,
    metadata: { type: "saved_search_alert" },
  });
}

export async function sendLeadNotification(to: string, contactName: string) {
  const provider = createEmailProvider();
  return provider.send({
    to,
    subject: `[Samsar IA] Nouveau lead — ${contactName}`,
    body: `Un nouveau lead a été reçu de ${contactName}.\n\nConsultez votre CRM Samsar IA.\n\n— Samsar IA (démo)`,
    metadata: { type: "lead_notification" },
  });
}
