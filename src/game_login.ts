import { z } from "zod";
import { infrai, InfraiError } from "./infrai.js";

export const loginRequest = z.object({ phone: z.string().min(8), code: z.string().regex(/^\d{4,8}$/).optional() });
export type LoginRequest = z.infer<typeof loginRequest>;
export type LoginResult = { state: "code_sent"; challengeId: string } | { state: "authenticated"; sessionId: string };

export async function login(raw: unknown): Promise<LoginResult> {
  const input = loginRequest.parse(raw);
  if (!input.code) {
    const challenge = await infrai.sms.otp({ to: input.phone, phone: input.phone });
    return { state: "code_sent", challengeId: challenge.id };
  }
  const verified = await infrai.auth.phone.verify({ phone: input.phone, code: input.code, login: true });
  const session = await infrai.auth.session.create({ user_id: verified.user_id, method: "phone" });
  return { state: "authenticated", sessionId: session.session_id };
}

export function clientResponse(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof InfraiError && error.status >= 400 && error.status < 500) return { status: error.status, body: { error: error.message } };
  return { status: 500, body: { error: "login unavailable" } };
}
