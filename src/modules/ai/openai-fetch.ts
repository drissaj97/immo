/** OpenAI quota / rate-limit aware fetch with automatic fallback signal */

export class OpenAIQuotaError extends Error {
  readonly code = "insufficient_quota" as const;
  constructor(message: string) {
    super(message);
    this.name = "OpenAIQuotaError";
  }
}

export async function openaiFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status === 429) {
    let body: { error?: { code?: string; message?: string } } = {};
    try {
      body = await res.clone().json();
    } catch {
      /* ignore */
    }
    const code = body.error?.code;
    if (code === "insufficient_quota" || body.error?.message?.includes("quota")) {
      throw new OpenAIQuotaError(body.error?.message ?? "OpenAI quota exceeded");
    }
  }
  return res;
}

export function shouldFallbackOnQuota(): boolean {
  return process.env.AI_FALLBACK_ON_QUOTA !== "false";
}
