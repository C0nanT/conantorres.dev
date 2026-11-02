import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createAttemptLimiter } from './rate-limit-core.ts'
import type { AttemptEntry } from './rate-limit-core.ts'

const MIN = 60_000
const HOUR = 60 * MIN

function setup() {
  let now = 1_000_000
  const attempts = new Map<string, AttemptEntry>()
  const capReachedBy: string[] = []
  const limiter = createAttemptLimiter({
    attempts,
    globalFailures: [],
    now: () => now,
    onCapReached: (ip) => {
      capReachedBy.push(ip)
    },
  })
  return {
    limiter,
    attempts,
    capReachedBy,
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
})

describe('global cap', () => {
  it('refuses the 11th try from any IP after 10 failures in 24 h', () => {
    const { limiter, advance } = setup()
    for (let i = 0; i < 10; i++) {
      assert.equal(limiter.registerAttempt(`10.0.0.${i}`).isAllowed, true)
      advance(MIN)
    }
    // 24 h after the first failure, which was 10 minutes ago.
    assert.deepEqual(limiter.registerAttempt('10.0.1.1'), {
      isAllowed: false,
      minutesLeft: 24 * 60 - 10,
    })
    assert.equal(limiter.getLockMinutesLeft('10.0.1.2'), 24 * 60 - 10)
  })

  it('warns on the 10th try that a wrong password closes the window', () => {
    const { limiter, advance } = setup()
    for (let i = 0; i < 9; i++) {
      limiter.registerAttempt(`10.0.0.${i}`)
      advance(MIN)
    }
    assert.deepEqual(limiter.registerAttempt('10.0.0.9'), {
      isAllowed: true,
      lockMinutesIfWrong: 24 * 60 - 9,
    })
  })

  it('slides: the oldest failure expiring frees one slot', () => {
    const { limiter, advance } = setup()
    for (let i = 0; i < 10; i++) {
      limiter.registerAttempt(`10.0.0.${i}`)
      advance(MIN)
    }
    advance(24 * HOUR - 10 * MIN)
    assert.equal(limiter.registerAttempt('10.0.1.1').isAllowed, true)
    assert.deepEqual(limiter.registerAttempt('10.0.1.2'), {
      isAllowed: false,
      minutesLeft: 1,
    })
  })

  it('a right password clears the IP but not the global count', () => {
    const { limiter } = setup()
    for (let i = 0; i < 9; i++) {
      limiter.registerAttempt(`10.0.0.${i}`)
    }
    assert.equal(limiter.registerAttempt('1.1.1.1').isAllowed, true)
    limiter.clearFailures('1.1.1.1')
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: false,
      minutesLeft: 24 * 60,
    })
  })

  it('reports the global lock when it outlasts the IP lock', () => {
    const { limiter } = setup()
    for (let i = 0; i < 3; i++) {
      limiter.registerAttempt('1.1.1.1')
    }
    for (let i = 0; i < 7; i++) {
      limiter.registerAttempt(`10.0.0.${i}`)
    }
    assert.equal(limiter.getLockMinutesLeft('1.1.1.1'), 24 * 60)
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: false,
      minutesLeft: 24 * 60,
    })
  })

  it('reports the IP lock when it outlasts the global lock', () => {
    const { limiter, advance } = setup()
    for (let i = 0; i < 7; i++) {
      limiter.registerAttempt(`10.0.0.${i}`)
    }
    advance(24 * HOUR - 5 * MIN)
    limiter.registerAttempt('1.1.1.1')
    limiter.registerAttempt('1.1.1.1')
    assert.deepEqual(limiter.registerAttempt('1.1.1.1'), {
      isAllowed: true,
      lockMinutesIfWrong: 20,
    })
    assert.equal(limiter.getLockMinutesLeft('1.1.1.1'), 20)
    assert.equal(limiter.getLockMinutesLeft('2.2.2.2'), 5)
  })

  it('signals only the try that reaches the cap, with its IP', () => {
    const { limiter, capReachedBy } = setup()
    for (let i = 0; i < 9; i++) {
      limiter.registerAttempt(`10.0.0.${i}`)
    }
    assert.deepEqual(capReachedBy, [])
    limiter.registerAttempt('203.0.113.7')
    assert.deepEqual(capReachedBy, ['203.0.113.7'])
    limiter.registerAttempt('10.0.1.1')
    limiter.getLockMinutesLeft('10.0.1.1')
    assert.deepEqual(capReachedBy, ['203.0.113.7'])
  })
})
