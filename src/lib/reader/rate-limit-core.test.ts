import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createAttemptLimiter } from './rate-limit-core.ts'
import type { AttemptEntry } from './rate-limit-core.ts'

const MIN = 60_000

function setup() {
  let now = 1_000_000
  const attempts = new Map<string, AttemptEntry>()
  const limiter = createAttemptLimiter({ attempts, now: () => now })
  return {
    limiter,
    attempts,
    advance: (ms: number) => {
      now += ms
    },
  }
}

describe('attempt limiter', () => {
  it('allows the first two wrong tries and locks on the third', () => {
    const { limiter } = setup()
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: true,
      lockMinutesIfWrong: 0,
    })
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: true,
      lockMinutesIfWrong: 0,
    })
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: true,
      lockMinutesIfWrong: 20,
    })
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: false,
      minutesLeft: 20,
    })
    assert.equal(limiter.getLockMinutesLeft('1.1.1.1'), 20)
  })

  it('unlocks after 20 minutes', () => {
    const { limiter, advance } = setup()
    for (let i = 0; i < 3; i++) {
      limiter.registerAttempt('1.1.1.1')
    }
    advance(19 * MIN)
    assert.equal(limiter.getLockMinutesLeft('1.1.1.1'), 1)
    advance(MIN)
    assert.equal(limiter.getLockMinutesLeft('1.1.1.1'), 0)
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: true,
      lockMinutesIfWrong: 0,
    })
  })

  it('a right password clears the failures', () => {
    const { limiter } = setup()
    limiter.registerAttempt('1.1.1.1')
    limiter.registerAttempt('1.1.1.1')
    limiter.clearFailures('1.1.1.1')
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: true,
      lockMinutesIfWrong: 0,
    })
  })

  it('another IP stays free', () => {
    const { limiter } = setup()
    for (let i = 0; i < 3; i++) {
      limiter.registerAttempt('1.1.1.1')
    }
    assert.equal(limiter.getLockMinutesLeft('2.2.2.2'), 0)
    assert.deepEqual(limiter.registerAttempt('2.2.2.2'), {
      isAllowed: true,
      lockMinutesIfWrong: 0,
    })
  })

  it('stale failures expire without a lock', () => {
    const { limiter, advance } = setup()
    limiter.registerAttempt('1.1.1.1')
    limiter.registerAttempt('1.1.1.1')
    advance(20 * MIN)
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: true,
      lockMinutesIfWrong: 0,
    })
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: true,
      lockMinutesIfWrong: 0,
    })
  })

  it('tracks at most 10 000 IPs, dropping the least recently active', () => {
    const { limiter, attempts } = setup()
    for (let i = 0; i < 10_001; i++) {
      limiter.registerAttempt(`ip-${i}`)
    }
    assert.equal(attempts.size, 10_000)
    assert.equal(attempts.has('ip-0'), false)
    assert.equal(attempts.has('ip-10000'), true)
  })
})
