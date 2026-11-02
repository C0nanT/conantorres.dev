// Pure core of the reader's wrong-password lockout: no Next, no globals, the
// clock and the state are passed in. Imports only node:* so it runs as-is
// under `node --test`.

import { BlockList, isIP } from 'node:net'

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

function toMinutes(ms: number): number {
  return Math.ceil(ms / 60_000)
}

// Cloudflare's edge ranges. Same list as `trustedIPs: &ips_cloudflare` in
// traefik-default's traefik/traefik.yml, checked on 2026-10-27: both lists
// change together, so update one whenever the other changes.
const CLOUDFLARE_RANGES = [
  // IPv4
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  // IPv6
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
] as const

function ipFamily(ip: string): 'ipv4' | 'ipv6' | undefined {
  const version = isIP(ip)
  if (version === 4) {
    return 'ipv4'
  }
  return version === 6 ? 'ipv6' : undefined
}

function buildCloudflareList(): BlockList {
  const list = new BlockList()
  for (const range of CLOUDFLARE_RANGES) {
    const [network = '', prefix = ''] = range.split('/')
    const family = ipFamily(network)
    if (family) {
      list.addSubnet(network, Number(prefix), family)
    }
  }
  return list
}

// Built once per process, on module load.
const cloudflare = buildCloudflareList()

/**
 * The client is the rightmost x-forwarded-for item outside Cloudflare's
 * ranges: Cloudflare appends the address it saw to whatever the client sent,
 * and Traefik appends Cloudflare's own address, so anything left of the
 * client's real address is client-controlled. Invalid items are skipped.
 * With no usable item, x-real-ip, then a shared 'unknown' bucket.
 */
export function pickClientIp(
  forwardedFor: string | null | undefined,
  realIp: string | null | undefined
): string {
  const items = (forwardedFor ?? '').split(',').map((item) => item.trim())
  for (const item of items.reverse()) {
    const family = ipFamily(item)
    if (family && !cloudflare.check(item, family)) {
      return item
    }
  }
  return realIp?.trim() || 'unknown'
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

  // The IP lock and the global cap give the same answer; the longer wins.
  function getLockMinutesLeft(ip: string): number {
    const now = readClock()
    pruneExpired(now)
    pruneGlobal(now)
    const lockedUntil = attempts.get(ip)?.lockedUntil
    const ipLockMs = lockedUntil === undefined ? 0 : lockedUntil - now
    return toMinutes(Math.max(ipLockMs, globalLockMs(now)))
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
    touch(ip, entry)
    globalFailures.push(now)
    const capLockMs = globalLockMs(now)
    if (capLockMs > 0) {
      onCapReached?.(ip)
    }
    const ipLockMs = isLastTry ? LOCK_DURATION_MS : 0
    return {
      isAllowed: true,
      lockMinutesIfWrong: toMinutes(Math.max(ipLockMs, capLockMs)),
    }
  }

  function clearFailures(ip: string): void {
    attempts.delete(ip)
  }

  return { getLockMinutesLeft, registerAttempt, clearFailures }
}
