/** Push notification provider — mock + Expo Push API */

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export interface PushProvider {
  readonly name: string;
  send(message: PushMessage): Promise<{ success: boolean; id?: string }>;
}

class MockPushProvider implements PushProvider {
  readonly name = "mock";

  async send(message: PushMessage) {
    console.info(`[push:mock] → ${message.to}: ${message.title}`);
    return { success: true, id: `push_mock_${Date.now()}` };
  }
}

class ExpoPushProvider implements PushProvider {
  readonly name = "expo";

  async send(message: PushMessage) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: message.to,
        title: message.title,
        body: message.body,
        data: message.data,
        sound: "default",
      }),
    });

    if (!res.ok) return { success: false };
    const json = (await res.json()) as { data?: { id?: string; status?: string }[] };
    const id = json.data?.[0]?.id;
    return { success: json.data?.[0]?.status === "ok", id };
  }
}

const tokenStore = new Map<string, Set<string>>();

export function registerPushToken(userId: string, token: string): void {
  const set = tokenStore.get(userId) ?? new Set();
  set.add(token);
  tokenStore.set(userId, set);
}

export function getPushTokens(userId: string): string[] {
  return Array.from(tokenStore.get(userId) ?? []);
}

export function createPushProvider(): PushProvider {
  if (process.env.PUSH_PROVIDER === "expo") {
    return new ExpoPushProvider();
  }
  return new MockPushProvider();
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<number> {
  const provider = createPushProvider();
  const tokens = getPushTokens(userId);
  let sent = 0;
  for (const to of tokens) {
    const result = await provider.send({ to, title, body, data });
    if (result.success) sent++;
  }
  return sent;
}
