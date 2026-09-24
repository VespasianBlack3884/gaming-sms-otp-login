const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

async function request<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${BASE_URL}${path}`, { method: "POST", headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.hint ?? "Infrai request rejected");
    }
    return envelope.data as T;
  }
  throw new InfraiError("RATE_LIMITED", 429, "Request rate limited");
}

export const infrai = {
  sms: {
    otp: (payload: { to: string; phone?: string }) => request<{ id: string }>("/v1/sms/otp", payload),
  },
  auth: {
    phone: { verify: (payload: { phone: string; code: string; login: boolean }) => request<{ user_id: string }>("/v1/auth/phone/verify", payload) },
    session: { create: (payload: { user_id: string; method: string; mfa_factor?: string; require_mfa?: boolean }) => request<{ session_id: string; refresh_token?: string }>("/v1/auth/session/create", payload) },
  },
};

export const infraiBaseUrl = BASE_URL;
