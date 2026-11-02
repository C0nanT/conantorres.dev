import { headers } from 'next/headers'
import {
  type AttemptEntry,
  createAttemptLimiter,
  pickClientIp,
} from './rate-limit-core'

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

// The core picks the client from the proxy chain; see `pickClientIp`.
export async function getClientIp(): Promise<string> {
  const headerList = await headers()
  return pickClientIp(
    headerList.get('x-forwarded-for'),
    headerList.get('x-real-ip')
  )
}
