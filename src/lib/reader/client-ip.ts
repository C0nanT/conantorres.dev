// Pure choice of the reader client's IP from the proxy chain: no Next, no
// globals. Imports only node:* so it runs as-is under `node --test`.

import { BlockList, isIP } from 'node:net'

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
