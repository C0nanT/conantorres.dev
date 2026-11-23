// Failure and recovery log for the YouTube live stats scraper. One console
// line per event, prefixed so it is easy to grep in `docker compose logs web`.
// Plain successes are silent.

const LOG_PREFIX = '[youtube-stats]'

export type StatsTarget = { type: 'video' | 'channel'; id: string }

type FailureRecord = {
  target: StatsTarget
  reason: string
  failedAt: string
  isClaimed: boolean
}

// Targets whose last scrape failed. In memory only: resets on restart.
const failedTargets = new Set<string>()

const failureRecords = new WeakMap<object, FailureRecord>()

function getTargetKey(target: StatsTarget) {
  return `${target.type}:${target.id}`
}

function describeTarget(target: StatsTarget) {
  return `alvo=${target.type} id=${target.id}`
}

function getErrorCode(error: Error) {
  const cause: unknown = error.cause
  if (cause && typeof cause === 'object' && 'code' in cause) {
    return String(cause.code)
  }
  return undefined
}

function describeFailure(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error)
  }
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return 'erro de rede: timeout'
  }
  if (error instanceof TypeError) {
    return `erro de rede: ${getErrorCode(error) ?? error.message}`
  }
  return error.message
}

function writeFailureLine(record: FailureRecord, isFallbackUsed: boolean) {
  const fallback = isFallbackUsed
    ? 'sim (valor do data/site)'
    : 'não (valor anterior do cache)'
  console.warn(
    `${LOG_PREFIX} ${record.failedAt} falha ${describeTarget(record.target)} motivo="${record.reason}" fallback=${fallback}`
  )
}

/**
 * Call from inside the cached scrape when it throws. The error is then either
 * rethrown to `logFallbackUsed` (no cache entry, data/site value shown) or
 * swallowed by Next (stale cache entry kept). Which one happens is only known
 * after the rejection settles, so the line is written either by
 * `logFallbackUsed` or, if nobody claims it, on the next macrotask.
 */
export function recordScrapeFailure(target: StatsTarget, error: unknown) {
  failedTargets.add(getTargetKey(target))
  const record: FailureRecord = {
    target,
    reason: describeFailure(error),
    failedAt: new Date().toISOString(),
    isClaimed: false,
  }
  if (error instanceof Error) {
    failureRecords.set(error, record)
  }
  setImmediate(() => {
    if (!record.isClaimed) {
      writeFailureLine(record, false)
    }
  })
}

/** Call from inside the cached scrape when it succeeds. */
export function recordScrapeSuccess(target: StatsTarget) {
  const key = getTargetKey(target)
  if (!failedTargets.delete(key)) {
    return
  }
  console.info(
    `${LOG_PREFIX} ${new Date().toISOString()} recuperado ${describeTarget(target)}`
  )
}

/** Call where the data/site fallback replaces a failed scrape. */
export function logFallbackUsed(target: StatsTarget, error: unknown) {
  const record = error instanceof Error ? failureRecords.get(error) : undefined
  if (record) {
    record.isClaimed = true
    writeFailureLine(record, true)
    return
  }
  // Failed outside the scrape (e.g. reading the cache itself).
  writeFailureLine(
    {
      target,
      reason: describeFailure(error),
      failedAt: new Date().toISOString(),
      isClaimed: true,
    },
    true
  )
}
