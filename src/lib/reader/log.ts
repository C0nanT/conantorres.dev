// Logs for the book reader, to find out why a read failed. Three channels,
// all one console line each and prefixed so they are easy to grep in
// `docker compose logs web` or the `pnpm dev` terminal:
//
// - `[reader-client]`: an error caught in the browser (viewer, error
//   boundary), reported back to the server so it shows up next to the server
//   logs. Always on.
// - `[reader-debug]`: the path of a request (cookie present, login result,
//   PDF cache hit or download). Only when READER_DEBUG=1.
// - `[reader-lock]`: the password lockout changed state, e.g.
//   `evento=teto-global` when the daily cap on wrong passwords across every
//   client is reached, with the IP of the try that reached it. Always on.
//
// Never receives a password, a cookie value, the Drive file ID or its URL.

const DEBUG_PREFIX = '[reader-debug]'
const CLIENT_PREFIX = '[reader-client]'
const LOCK_PREFIX = '[reader-lock]'
const MAX_VALUE_LENGTH = 300

type DebugValue = string | number | boolean | null | undefined

function oneLine(value: string, max = MAX_VALUE_LENGTH): string {
  const flat = value.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max)}…` : flat
}

export function isReaderDebug(): boolean {
  return process.env.READER_DEBUG === '1'
}

export function debugReader(
  event: string,
  fields: Record<string, DebugValue> = {}
) {
  if (!isReaderDebug()) {
    return
  }
  const extra = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ` ${key}=${oneLine(String(value))}`)
    .join('')
  console.info(
    `${DEBUG_PREFIX} ${new Date().toISOString()} evento=${event}${extra}`
  )
}

export function logReaderClientError(
  bookId: string,
  origin: string,
  message: string
) {
  console.warn(
    `${CLIENT_PREFIX} ${new Date().toISOString()} livro=${oneLine(bookId, 80)} origem=${oneLine(origin, 60)} erro=${oneLine(message)}`
  )
}

export function logReaderLockout(event: string, ip: string) {
  console.warn(
    `${LOCK_PREFIX} ${new Date().toISOString()} evento=${oneLine(event, 40)} ip=${oneLine(ip, 80)}`
  )
}
