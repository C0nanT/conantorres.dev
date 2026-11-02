import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pickClientIp } from './client-ip.ts'

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
