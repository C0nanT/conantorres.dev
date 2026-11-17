'use client'

import { cleanSentence, sentenceBounds } from '@/lib/reader/sentence-at'
import { useTranslations } from 'next-intl'
import { type RefObject, useEffect } from 'react'
import { toast } from 'sonner'

const HIGHLIGHT_NAME = 'reader-sentence-copy'
// Injected at runtime instead of living in globals.css: Turbopack's CSS
// parser (lightningcss) rejects `::highlight()` and fails `pnpm dev`.
// PDF pages stay white in both themes, so the colour is the light primary.
// A copy is confirmed by the sentence turning green, with no hover colour
// under it, and a small "Copiado" badge at the pointer, both for COPIED_MS.
const COPIED_NAME = 'reader-sentence-copied'
const COPIED_MS = 1200
const BADGE_CLASS =
  'pointer-events-none fixed z-50 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 font-medium text-white text-xs shadow-lg'
const HIGHLIGHT_CSS = [
  `::highlight(${HIGHLIGHT_NAME}) { background-color: hsl(14 48% 43% / 0.3); }`,
  `::highlight(${COPIED_NAME}) { background-color: hsl(142 70% 40% / 0.55); }`,
].join('\n')
const HIGHLIGHT_STYLE_ID = 'reader-sentence-copy-style'

interface TextPiece {
  node: Text
  // Index of the node's first character in the page's text.
  start: number
}

interface FoundSentence {
  sentence: string
  range: Range
}

// The text node and offset under the pointer. Chrome before 128 only has
// caretRangeFromPoint; everything else has the standard one.
function caretAt(x: number, y: number) {
  if (typeof document.caretPositionFromPoint === 'function') {
    const position = document.caretPositionFromPoint(x, y)
    return position
      ? { node: position.offsetNode, offset: position.offset }
      : null
  }
  const range = document.caretRangeFromPoint?.(x, y)
  return range
    ? { node: range.startContainer, offset: range.startOffset }
    : null
}

// A gap taller than this share of a line's height is a paragraph break.
const PARAGRAPH_GAP = 0.6
// Font sizes this far apart (relative) mean a heading or a footnote line.
const FONT_SIZE_JUMP = 0.08

// Whether a line end between two spans is more than a wrapped line: a new
// paragraph or a heading, seen as a taller gap or another font size.
function isParagraphBreak(before: Element, after: Element) {
  const a = before.getBoundingClientRect()
  const b = after.getBoundingClientRect()
  const sizeA = Number.parseFloat(getComputedStyle(before).fontSize)
  const sizeB = Number.parseFloat(getComputedStyle(after).fontSize)
  if (sizeA > 0 && Math.abs(sizeA - sizeB) / sizeA > FONT_SIZE_JUMP) {
    return true
  }
  const gap = b.top - a.bottom
  return a.height > 0 && gap > a.height * PARAGRAPH_GAP
}

// One page's text layer as a string, in reading order, with '\n' where
// pdf.js marks a line end (<br>) and '\n\n' where that line end is a
// paragraph or heading break, plus where each text node sits in it.
function readTextLayer(layer: Element) {
  let text = ''
  const pieces: TextPiece[] = []
  let previous: Element | null = null
  let isLineEnd = false
  const walker = document.createTreeWalker(
    layer,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  )
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Text) {
      const element = node.parentElement
      if (
        isLineEnd &&
        previous &&
        element &&
        element !== previous &&
        isParagraphBreak(previous, element)
      ) {
        text += '\n'
      }
      isLineEnd = false
      pieces.push({ node, start: text.length })
      text += node.data
      previous = element
    } else if (node.nodeName === 'BR') {
      text += '\n'
      isLineEnd = true
    }
  }
  return { text, pieces }
}

// The text node holding the character at `index` of the page's text.
function pieceAt(pieces: TextPiece[], index: number) {
  for (const piece of pieces) {
    if (index >= piece.start && index < piece.start + piece.node.length) {
      return piece
    }
  }
  return null
}

// The sentence under a screen point, as text and as a DOM range over the
// text layer's spans. Reads only that page's text layer, already in the DOM.
function findSentence(x: number, y: number): FoundSentence | null {
  const caret = caretAt(x, y)
  if (!(caret && caret.node instanceof Text)) {
    return null
  }
  const layer = caret.node.parentElement?.closest('.textLayer')
  if (!layer) {
    return null
  }
  const { text, pieces } = readTextLayer(layer)
  const target = pieces.find((piece) => piece.node === caret.node)
  if (!target) {
    return null
  }
  // A point past a line's last character lands on its end, not on a char.
  const offset = Math.min(target.start + caret.offset, text.length - 1)
  const bounds = sentenceBounds(text, offset)
  if (!bounds) {
    return null
  }
  const first = pieceAt(pieces, bounds.start)
  const last = pieceAt(pieces, bounds.end - 1)
  if (!(first && last)) {
    return null
  }
  const range = document.createRange()
  range.setStart(first.node, bounds.start - first.start)
  range.setEnd(last.node, bounds.end - last.start)
  return {
    sentence: cleanSentence(text.slice(bounds.start, bounds.end)),
    range,
  }
}

function canHighlight() {
  return typeof CSS !== 'undefined' && 'highlights' in CSS
}

function ensureHighlightStyle() {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) {
    return
  }
  const style = document.createElement('style')
  style.id = HIGHLIGHT_STYLE_ID
  style.textContent = HIGHLIGHT_CSS
  document.head.append(style)
}

function showHighlight(range: Range | null) {
  if (!canHighlight()) {
    return
  }
  if (range) {
    ensureHighlightStyle()
    CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(range))
  } else {
    CSS.highlights.delete(HIGHLIGHT_NAME)
  }
}

function showCopiedRange(range: Range | null) {
  if (!canHighlight()) {
    return
  }
  if (range) {
    ensureHighlightStyle()
    CSS.highlights.set(COPIED_NAME, new Highlight(range))
  } else {
    CSS.highlights.delete(COPIED_NAME)
  }
}

// A "✓ Copiado" badge just above the pointer that rises and fades out
// (transform and opacity only; with reduced motion it just appears and goes).
function showCopiedBadge(x: number, y: number, label: string) {
  const badge = document.createElement('div')
  badge.className = BADGE_CLASS
  badge.setAttribute('role', 'status')
  badge.textContent = `✓ ${label}`
  badge.style.left = `${x}px`
  badge.style.top = `${y - 36}px`
  badge.style.transform = 'translateX(-50%)'
  document.body.append(badge)

  const isReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  if (isReduced) {
    window.setTimeout(() => badge.remove(), COPIED_MS)
    return
  }
  const animation = badge.animate(
    [
      { opacity: 0, transform: 'translate(-50%, 6px)' },
      { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.15 },
      { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.75 },
      { opacity: 0, transform: 'translate(-50%, -6px)' },
    ],
    { duration: COPIED_MS, easing: 'ease-out' }
  )
  animation.onfinish = () => badge.remove()
  animation.oncancel = () => badge.remove()
}

// While copy mode is on (the toolbar switch), the sentence under the pointer
// gets a background (CSS Custom Highlight API, no DOM change) and a click
// copies it. Nothing is indexed: each look-up reads only the hovered page's
// text layer, at most once per animation frame.
export function useSentenceCopy(
  scrollRef: RefObject<HTMLElement | null>,
  isEnabled: boolean
) {
  const t = useTranslations('reader.sentenceCopy')

  useEffect(() => {
    const scroller = scrollRef.current
    if (!(scroller && isEnabled)) {
      return
    }

    let pointer: { x: number; y: number } | null = null
    let frame = 0
    let copiedTimer = 0
    let isShowingCopied = false

    const refreshHighlight = () => {
      frame = 0
      // The green copied sentence stays alone until it ends.
      if (isShowingCopied) {
        return
      }
      const found = pointer && findSentence(pointer.x, pointer.y)
      showHighlight(found ? found.range : null)
    }
    const scheduleHighlight = () => {
      if (!frame) {
        frame = requestAnimationFrame(refreshHighlight)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      pointer = { x: event.clientX, y: event.clientY }
      scheduleHighlight()
    }
    const handleMouseLeave = () => {
      pointer = null
      scheduleHighlight()
    }
    // Scrolling moves the text under a still pointer.
    const handleScroll = () => {
      if (pointer) {
        scheduleHighlight()
      }
    }

    const handleClick = (event: MouseEvent) => {
      // A drag that selected text keeps the normal selection and copy.
      if (!window.getSelection()?.isCollapsed) {
        return
      }
      const found = findSentence(event.clientX, event.clientY)
      // Margins, images and links (annotation layer) are left alone.
      if (!found?.sentence) {
        return
      }
      event.preventDefault()
      const { sentence, range } = found
      navigator.clipboard
        .writeText(sentence)
        .then(() => {
          window.clearTimeout(copiedTimer)
          isShowingCopied = true
          showHighlight(null)
          showCopiedRange(range)
          showCopiedBadge(event.clientX, event.clientY, t('copied'))
          copiedTimer = window.setTimeout(() => {
            isShowingCopied = false
            showCopiedRange(null)
            scheduleHighlight()
          }, COPIED_MS)
        })
        .catch(() => {
          toast.error(t('failed'))
        })
    }

    scroller.addEventListener('click', handleClick)
    scroller.addEventListener('mousemove', handleMouseMove)
    scroller.addEventListener('mouseleave', handleMouseLeave)
    scroller.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(copiedTimer)
      showCopiedRange(null)
      showHighlight(null)
      scroller.removeEventListener('click', handleClick)
      scroller.removeEventListener('mousemove', handleMouseMove)
      scroller.removeEventListener('mouseleave', handleMouseLeave)
      scroller.removeEventListener('scroll', handleScroll)
    }
  }, [scrollRef, isEnabled, t])
}
