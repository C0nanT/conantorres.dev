// Pure core of the reader's wrong-password lockout: no Next, no globals, the
// clock and the state are passed in. No imports, so it runs as-is under
// `node --test`. The client IP choice lives in `client-ip.ts`.

const MAX_FAILURES = 3
const LOCK_DURATION_MS = 20 * 60 * 1000
// Past this many tracked IPs the least recently active ones are dropped, so a
// flood of spoofed addresses cannot grow the map without bound.
const MAX_TRACKED_IPS = 10_000
// Across every IP: at most this many failures in a sliding window. Reaching it
// refuses every try, the right password included, until the oldest expires.
const GLOBAL_MAX_FAILURES = 10
const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000

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
  /** Failure instants across every IP, oldest first; mutated in place. */
  globalFailures: number[]
  now: () => number
  /** Called once, with the IP of the try that just reached the global cap. */
  onCapReached?: (ip: string) => void
}

function isExpired(entry: AttemptEntry, now: number): boolean {
  return entry.lockedUntil === undefined
    ? entry.lastFailureAt + LOCK_DURATION_MS <= now
    : entry.lockedUntil <= now
}

// The IP lock and the global cap give the same answer; the longer wins.
function longestLockMinutes(ipLockMs: number, globalLockMs: number): number {
  return Math.ceil(Math.max(ipLockMs, globalLockMs) / 60_000)
}

export function createAttemptLimiter({
  attempts,
  globalFailures,
  now: readClock,
  onCapReached,
}: LimiterDeps): AttemptLimiter {
  function pruneGlobal(now: number): void {
    while (
      globalFailures.length > 0 &&
      (globalFailures[0] ?? 0) + GLOBAL_WINDOW_MS <= now
    ) {
      globalFailures.shift()
    }
  }

  /** Milliseconds until the global cap frees a slot, or 0 when not reached. */
  function globalLockMs(now: number): number {
    if (globalFailures.length < GLOBAL_MAX_FAILURES) {
      return 0
    }
    return (globalFailures[0] ?? now) + GLOBAL_WINDOW_MS - now
  }

  // `markActive` keeps the map ordered by last failure, oldest first, and an
  // entry expires LOCK_DURATION_MS after its last failure (a lock is only set
  // on a failure, and a locked IP gets no new failure until the lock ends),
  // so the first unexpired entry ends the expired run.
  function pruneExpired(now: number): void {
    for (const [ip, entry] of attempts) {
      if (!isExpired(entry, now)) {
        break
      }
      attempts.delete(ip)
    }
  }

  // Re-inserts `ip` as the most recently active, then drops the least
  // recently active ones past MAX_TRACKED_IPS.
  function markActive(ip: string, entry: AttemptEntry): void {
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
    pruneGlobal(now)
    const lockedUntil = attempts.get(ip)?.lockedUntil
    const ipLockMs = lockedUntil === undefined ? 0 : lockedUntil - now
    return longestLockMinutes(ipLockMs, globalLockMs(now))
  }

  /**
   * Counts a password attempt as a failure up front, before the password is
   * compared, so parallel requests cannot all pass the lock check. It counts
   * for the IP and for the global cap. Synchronous on purpose: nothing can
   * interleave between the check and the count. Call `clearFailures` when the
   * password turns out right; the global count is kept either way.
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
    markActive(ip, entry)
    globalFailures.push(now)
    const capLockMs = globalLockMs(now)
    if (capLockMs > 0) {
      onCapReached?.(ip)
    }
    const ipLockMs = isLastTry ? LOCK_DURATION_MS : 0
    return {
      isAllowed: true,
      lockMinutesIfWrong: longestLockMinutes(ipLockMs, capLockMs),
    }
  }

  function clearFailures(ip: string): void {
    attempts.delete(ip)
  }

  return { getLockMinutesLeft, registerAttempt, clearFailures }
}
