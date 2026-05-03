// =============================================================================
// ARNOLD — Adaptation Queue
// Stores pending adaptations between sessions. Decisions queue here after
// session end, get surfaced in chat when user engages, and apply when the
// next session starts.
//
// If the user never opens chat, adaptations still apply silently.
// The queue is the "propose and approve" layer from the AI Brain Strategy.
// =============================================================================

export type AdaptationType =
  | "weight_increase"
  | "weight_decrease"
  | "weight_hold"
  | "progression_advance"
  | "progression_regress"
  | "volume_adjustment"
  | "deload_trigger"
  | "finisher_trend";

export interface AdaptationItem {
  id: string;
  type: AdaptationType;
  /** Which exercise this applies to (progressionId for weighted, exerciseId for others) */
  exerciseKey: string;
  /** Human-readable exercise name */
  exerciseName: string;
  /** What changes: "+2.5kg", "Advance to Archer Pull-ups", etc. */
  change: string;
  /** Why Arnold made this decision — surfaced in chat */
  reason: string;
  /** The actual numeric adjustment for weight changes (kg) */
  weightDeltaKg?: number;
  /** New progression ID for progression changes */
  newProgressionId?: string;
  /** When this was queued */
  createdAt: string;
  /** Has the user seen this in chat? */
  surfaced: boolean;
  /** Did the user explicitly approve or override? null = not yet addressed */
  userResponse: "approved" | "rejected" | null;
  /** Has this adaptation been baked into a session? Prevents double-apply. */
  applied: boolean;
}

export interface AdaptationQueue {
  items: AdaptationItem[];
  /** Last session ID that generated these adaptations */
  fromSessionId: string;
  /** When the queue was last updated */
  updatedAt: string;
}

// ── Queue Helpers ───────────────────────────────────────────────────────────

export function createEmptyQueue(): AdaptationQueue {
  return { items: [], fromSessionId: "", updatedAt: new Date().toISOString() };
}

export function addToQueue(
  queue: AdaptationQueue,
  item: Omit<AdaptationItem, "id" | "createdAt" | "surfaced" | "userResponse" | "applied">,
  sessionId: string,
): AdaptationQueue {
  const newItem: AdaptationItem = {
    ...item,
    id: `adapt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    surfaced: false,
    userResponse: null,
    applied: false,
  };

  return {
    items: [...queue.items, newItem],
    fromSessionId: sessionId,
    updatedAt: new Date().toISOString(),
  };
}

/** Get all unsurfaced items (for chat to display) */
export function getUnsurfacedItems(queue: AdaptationQueue): AdaptationItem[] {
  return queue.items.filter(i => !i.surfaced);
}

/** Mark items as surfaced (after Arnold mentions them in chat) */
export function markAsSurfaced(queue: AdaptationQueue, itemIds: string[]): AdaptationQueue {
  return {
    ...queue,
    items: queue.items.map(i =>
      itemIds.includes(i.id) ? { ...i, surfaced: true } : i
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** Mark a specific item as approved or rejected by the user */
export function respondToItem(
  queue: AdaptationQueue,
  itemId: string,
  response: "approved" | "rejected",
): AdaptationQueue {
  return {
    ...queue,
    items: queue.items.map(i =>
      i.id === itemId ? { ...i, userResponse: response } : i
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** Get items ready to apply (approved or never addressed — silent apply) */
export function getApplicableItems(queue: AdaptationQueue): AdaptationItem[] {
  return queue.items.filter(i => i.userResponse !== "rejected");
}

/** Get weight adjustments by exercise key (skips already-applied items) */
export function getWeightAdjustment(queue: AdaptationQueue, exerciseKey: string): number {
  const weightItems = queue.items.filter(
    i => i.exerciseKey === exerciseKey
      && (i.type === "weight_increase" || i.type === "weight_decrease")
      && i.userResponse !== "rejected"
      && !i.applied
  );
  return weightItems.reduce((sum, i) => sum + (i.weightDeltaKg ?? 0), 0);
}

/** Get weight delta + contributing item IDs for a specific exercise.
 *  Use this when the caller needs to know WHICH items contributed so it can
 *  mark them as applied afterwards. */
export function getWeightAdjustmentWithSources(
  queue: AdaptationQueue,
  exerciseKey: string,
): { delta: number; itemIds: string[] } {
  const weightItems = queue.items.filter(
    i => i.exerciseKey === exerciseKey
      && (i.type === "weight_increase" || i.type === "weight_decrease")
      && i.userResponse !== "rejected"
      && !i.applied
  );
  return {
    delta: weightItems.reduce((sum, i) => sum + (i.weightDeltaKg ?? 0), 0),
    itemIds: weightItems.map(i => i.id),
  };
}

/** Mark items as applied (baked into a session). Prevents re-applying.
 *  Does NOT remove items — they stay in the queue for chat reference. */
export function markAsApplied(queue: AdaptationQueue, itemIds: string[]): AdaptationQueue {
  if (itemIds.length === 0) return queue;
  return {
    ...queue,
    items: queue.items.map(i =>
      itemIds.includes(i.id) ? { ...i, applied: true } : i
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** Clear the queue after adaptations have been applied */
export function clearQueue(): AdaptationQueue {
  return createEmptyQueue();
}

/** Format queue items for Arnold to surface in chat */
export function formatForChat(items: AdaptationItem[]): string {
  if (items.length === 0) return "";

  const weightChanges = items.filter(i =>
    i.type === "weight_increase" || i.type === "weight_decrease"
  );
  const progressionChanges = items.filter(i =>
    i.type === "progression_advance" || i.type === "progression_regress"
  );
  const other = items.filter(i =>
    !["weight_increase", "weight_decrease", "progression_advance", "progression_regress"].includes(i.type)
  );

  const parts: string[] = [];

  if (weightChanges.length > 0) {
    const changes = weightChanges.map(i => `${i.exerciseName}: ${i.change}`).join(". ");
    parts.push(`Weight updates: ${changes}.`);
  }

  if (progressionChanges.length > 0) {
    const changes = progressionChanges.map(i => `${i.exerciseName}: ${i.change}`).join(". ");
    parts.push(`Progression: ${changes}.`);
  }

  if (other.length > 0) {
    other.forEach(i => parts.push(`${i.reason}`));
  }

  return parts.join(" ");
}
