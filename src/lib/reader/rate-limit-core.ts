// Pure core of the reader's wrong-password lockout: no Next, no globals, the
// clock and the state are passed in. Imports only node:* so it runs as-is
// under `node --test`.

import { BlockList, isIP } from 'node:net'

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
