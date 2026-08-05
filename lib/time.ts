const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface DayWindow {
  /** Date of the current day window (YYYY-MM-DD) */
  date: string;
  /** Reset instant (timestamp ms) for this window */
  resetAt: number;
  /** Next reset instant (timestamp ms) */
  nextResetAt: number;
  /** Total budget for this window (ms) */
  budgetMs: number;
  /** How much budget has elapsed so far (ms) */
  elapsedMs: number;
  /** Remaining budget (ms) */
  remainingMs: number;
  /** 0..1 fraction of budget remaining */
  remainingRatio: number;
}

/**
 * Compute the current day window for a given reset hour (0-23).
 * A window spans [resetAt, nextResetAt). Everything is derived
 * from the given instant `now` so this stays a pure function.
 */
export function getDayWindow(
  now: Date,
  resetHour: number,
  dailyHours: number,
): DayWindow {
  const t = now.getTime();
  const resetHourMs = resetHour * HOUR;

  const todayReset = new Date(now);
  todayReset.setHours(0, 0, 0, 0);
  const todayResetAt = todayReset.getTime() + resetHourMs;

  // If now is before today's reset, the window started yesterday.
  const resetAt = t < todayResetAt ? todayResetAt - DAY : todayResetAt;
  const nextResetAt = resetAt + DAY;

  const elapsedMs = t - resetAt;
  const budgetMs = dailyHours * HOUR;
  const remainingMs = Math.max(0, budgetMs - elapsedMs);
  const remainingRatio = budgetMs > 0 ? remainingMs / budgetMs : 0;

  return {
    date: new Date(resetAt).toISOString().slice(0, 10),
    resetAt,
    nextResetAt,
    budgetMs,
    elapsedMs,
    remainingMs,
    remainingRatio,
  };
}

export interface Duration {
  days: number;
  hours: number;
  minutes: number;
}

export function splitDuration(ms: number): Duration {
  const totalMinutes = Math.floor(ms / MINUTE);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

export function formatClock(ms: number): string {
  const { hours, minutes } = splitDuration(ms);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatRemaining(ms: number): string {
  const { days, hours, minutes } = splitDuration(ms);
  if (days > 0) return `${days}j ${hours}j ${minutes}m`;
  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m`;
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}
