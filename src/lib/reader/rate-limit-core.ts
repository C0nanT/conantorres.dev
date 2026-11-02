// Pure core of the reader's wrong-password lockout: no Next, no globals, the
// clock and the state are passed in. Imports only node:* so it runs as-is
// under `node --test`.

const MAX_FAILURES = 3
const LOCK_DURATION_MS = 20 * 60 * 1000
// Past this many tracked IPs the least recently active ones are dropped, so a
// flood of spoofed addresses cannot grow the map without bound.
const MAX_TRACKED_IPS = 10_000

export interface AttemptEntry {
  failures: number
  lastFailureAt: number
  lockedUntil?: number
}

export type AttemptCheck =
  | { isAllowed: false; minutesLeft: number }
  /** `lockMinutesIfWrong` is 0 unless this try is the last one allowed. */
  | { isAllowed: true; lockMinutesIfWrong: number }

export interface AttemptLimiter {
  /** Whole minutes until `ip` may try again, or 0 when it is not locked. */
  getLockMinutesLeft(ip: string): number
  registerAttempt(ip: string): AttemptCheck
  clearFailures(ip: string): void
}

interface LimiterDeps {
  attempts: Map<string, AttemptEntry>
  now: () => number
}

function isExpired(entry: AttemptEntry, now: number): boolean {
  return entry.lockedUntil === undefined
    ? entry.lastFailureAt + LOCK_DURATION_MS <= now
    : entry.lockedUntil <= now
}

function toMinutes(ms: number): number {
  return Math.ceil(ms / 60_000)
}

export function createAttemptLimiter({
  attempts,
  now: readClock,
}: LimiterDeps): AttemptLimiter {
  function pruneExpired(now: number): void {
    for (const [ip, entry] of attempts) {
      if (isExpired(entry, now)) {
        attempts.delete(ip)
      }
    }
  }

  // Re-inserting keeps the map ordered by last activity, oldest first.
  function touch(ip: string, entry: AttemptEntry): void {
    attempts.delete(ip)
    attempts.set(ip, entry)
    for (const oldest of attempts.keys()) {
      if (attempts.size <= MAX_TRACKED_IPS) {
        break
      }
      attempts.delete(oldest)
    }
  }

  function getLockMinutesLeft(ip: string): number {
    const now = readClock()
    pruneExpired(now)
    const lockedUntil = attempts.get(ip)?.lockedUntil
    return lockedUntil === undefined ? 0 : toMinutes(lockedUntil - now)
  }

  /**
   * Counts a password attempt as a failure up front, before the password is
   * compared, so parallel requests cannot all pass the lock check.
   * Synchronous on purpose: nothing can interleave between the check and the
   * count. Call `clearFailures` when the password turns out right.
   */
  function registerAttempt(ip: string): AttemptCheck {
    const minutesLeft = getLockMinutesLeft(ip)
    if (minutesLeft > 0) {
      return { isAllowed: false, minutesLeft }
    }
    const now = readClock()
    const entry = attempts.get(ip) ?? { failures: 0, lastFailureAt: now }
    entry.failures += 1
    entry.lastFailureAt = now
    const isLastTry = entry.failures >= MAX_FAILURES
    if (isLastTry) {
      entry.lockedUntil = now + LOCK_DURATION_MS
    }
    touch(ip, entry)
    return {
      isAllowed: true,
      lockMinutesIfWrong: isLastTry ? toMinutes(LOCK_DURATION_MS) : 0,
    }
  }

  function clearFailures(ip: string): void {
    attempts.delete(ip)
  }

  return { getLockMinutesLeft, registerAttempt, clearFailures }
}
