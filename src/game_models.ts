export type PlayerAsset = { id: string; ownerId: string; kind: "skin" | "badge"; metadata: Record<string, string> };
export type LiveEvent = { id: string; title: string; startsAt: string; active: boolean };
export type ModerationItem = { id: string; playerId: string; reason: string; status: "queued" | "reviewed" };

export const sampleEvent: LiveEvent = { id: "event-1", title: "Weekend Arena", startsAt: "2026-09-20T18:00:00Z", active: true };
export const moderationQueue: ModerationItem[] = [];
