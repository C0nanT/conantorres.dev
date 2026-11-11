import { site } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import type { CSSProperties, ReactNode } from 'react'

// `**texto**` in site copy marks a highlighted keyword.
const HIGHLIGHT_PATTERN = /\*\*(.+?)\*\*/g

const HIGHLIGHT_CLASS =
  'relative font-semibold text-foreground transition-colors duration-200 hover:text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none'

// A cursor image cannot read CSS variables, so the hover color (`--primary`
// in globals.css, light and dark) is repeated here: keep both in sync.
const CURSOR_COLORS = {
  light: { fill: 'hsl(14 48% 43%)', outline: '#fff' },
  dark: { fill: 'hsl(30 100% 69%)', outline: '#000' },
}

const SYMBOL_CURSOR_CLASS =
  '[cursor:var(--symbol-cursor)] dark:[cursor:var(--symbol-cursor-dark)]'

// A mouse cursor drawn from a text symbol (e.g. ♞) in the hover color; falls
// back to the default cursor where SVG cursors are not supported.
function symbolCursor(
  symbol: string,
  colors: { fill: string; outline: string }
) {
  // Ignore the text-presentation selector (U+FE0E) when counting characters.
  const length = [...symbol.replace('︎', '')].length
  const fontSize = length > 1 ? 14 : 28
  const y = length > 1 ? 21 : 27
  const text = symbol
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text x="16" y="${y}" font-size="${fontSize}" font-weight="700" text-anchor="middle" fill="${colors.fill}" stroke="${colors.outline}" stroke-width="1.5" paint-order="stroke">${text}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, auto`
}

// The cursor for each theme goes into a CSS variable; the class picks one.
function symbolCursorStyle(symbol: string) {
  return {
    '--symbol-cursor': symbolCursor(symbol, CURSOR_COLORS.light),
    '--symbol-cursor-dark': symbolCursor(symbol, CURSOR_COLORS.dark),
  } as CSSProperties
}

/**
 * Renders site copy, turning each `**keyword**` into a bold keyword with a
 * hover underline. A keyword listed in `site.json` → `highlightCursors` also
 * swaps the mouse cursor for its symbol. Works in server and client
 * components.
 */
export function HighlightedText({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  let cursor = 0
  for (const match of text.matchAll(HIGHLIGHT_PATTERN)) {
    const start = match.index ?? 0
    const keyword = match[1] ?? ''
    const symbol = site.highlightCursors[keyword]
    if (start > cursor) {
      nodes.push(text.slice(cursor, start))
    }
    nodes.push(
      <strong
        key={start}
        className={cn(HIGHLIGHT_CLASS, symbol && SYMBOL_CURSOR_CLASS)}
        style={symbol ? symbolCursorStyle(symbol) : undefined}
      >
        {keyword}
      </strong>
    )
    cursor = start + match[0].length
  }
  nodes.push(text.slice(cursor))
  return <>{nodes}</>
}
