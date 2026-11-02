import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createAttemptLimiter, pickClientIp } from './rate-limit-core.ts'
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

describe('client IP choice', () => {
  it('uses the only item of a direct request', () => {
    assert.equal(pickClientIp('203.0.113.7', null), '203.0.113.7')
  })

  it('skips the Cloudflare hop and ignores a forged leading value', () => {
    assert.equal(
      pickClientIp('9.9.9.9, 203.0.113.7, 172.70.1.2', null),
      '203.0.113.7'
    )
  })

  it('picks the client from a Cloudflare chain with no forged value', () => {
    assert.equal(pickClientIp('203.0.113.7, 162.158.4.5', null), '203.0.113.7')
  })

  it('uses the socket address Next fills in locally', () => {
    assert.equal(pickClientIp('::1', null), '::1')
    assert.equal(pickClientIp('127.0.0.1', null), '127.0.0.1')
  })

  it('handles IPv6 for both Cloudflare and the client', () => {
    assert.equal(
      pickClientIp('2001:db8::1, 2001:db8::42, 2606:4700:10::ac43:1', null),
      '2001:db8::42'
    )
  })

  it('treats both edges of a Cloudflare range as Cloudflare', () => {
    assert.equal(
      pickClientIp('203.0.113.7, 173.245.48.0, 173.245.63.255', null),
      '203.0.113.7'
    )
    assert.equal(
      pickClientIp('203.0.113.7, 2a06:98c0::1, 2a06:98c7:ffff::1', null),
      '203.0.113.7'
    )
    assert.equal(pickClientIp('173.245.64.0', null), '173.245.64.0')
  })

  it('skips invalid, empty and padded items', () => {
    assert.equal(
      pickClientIp(' 203.0.113.7 ,, not-an-ip, 999.1.1.1 , 172.70.1.2', null),
      '203.0.113.7'
    )
  })

  it('falls back when every item is Cloudflare or invalid', () => {
    assert.equal(
      pickClientIp('172.70.1.2, 2400:cb00::1', '198.51.100.4'),
      '198.51.100.4'
    )
    assert.equal(pickClientIp('garbage, ', null), 'unknown')
  })

  it('falls back to x-real-ip, then unknown, when the header is missing', () => {
    assert.equal(pickClientIp(null, ' 198.51.100.4 '), '198.51.100.4')
    assert.equal(pickClientIp(undefined, undefined), 'unknown')
    assert.equal(pickClientIp(null, ''), 'unknown')
  })
})
