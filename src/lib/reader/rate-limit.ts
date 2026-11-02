import { headers } from 'next/headers'
import { type AttemptEntry, createAttemptLimiter } from './rate-limit-core'

export type { AttemptCheck } from './rate-limit-core'

// Thin shell over the pure core: owns the process-wide state and the clock.
// Counters live in this process only, so a restart clears every lock.

declare global {
  // Kept on globalThis so dev hot reloads do not reset the counters.
  var readerAttempts: Map<string, AttemptEntry> | undefined
}
globalThis.readerAttempts ??= new Map<string, AttemptEntry>()

const limiter = createAttemptLimiter({
  attempts: globalThis.readerAttempts,
  now: Date.now,
})

export const { getLockMinutesLeft, registerAttempt, clearFailures } = limiter

// First hop of x-forwarded-for. Behind a proxy that is the client the proxy
// saw; without one, Next's server fills the header with the socket address.
// x-real-ip and a shared 'unknown' bucket are last-resort fallbacks.
export async function getClientIp(): Promise<string> {
  const headerList = await headers()
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headerList.get('x-real-ip')?.trim() || 'unknown'
}
