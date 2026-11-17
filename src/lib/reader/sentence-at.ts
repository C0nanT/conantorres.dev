// Picks the sentence around a character of a page's text, for Alt+click copy
// in the reader. Pure: no DOM or Node imports, so it is safe in the browser.
// `text` is the page's text layer joined in order, with '\n' at line ends.

// Sentence segmentation treats '\n' as a paragraph break, which would cut
// every PDF line into its own "sentence". Lines are joined with spaces for
// the search (same length, so offsets still match) and cleaned afterwards.
// A lone '\n' is a soft line end. '\n\n' marks a paragraph or heading
// boundary found by the caller; it stays, and the segmenter cuts there.
const LINE_BREAKS = /(?<!\n)\n(?!\n)/g
// "...day.9 Domain" : a footnote number glued to the full stop. The
// segmenter sees no break in ".9", so the sentence is cut after the digits.
const FOOTNOTE_MARK = /[.!?…]["'”’)\]]*(\d{1,3})(?=\s)/g
// "inter-\nnet" -> "internet": a hyphen at a line end before a lowercase
// letter is the PDF's word wrap, not part of the word.
const WRAP_HYPHEN = /(\p{L})-\n(?=\p{Ll})/gu
// "Strangler-\nFig" -> "Strangler-Fig": any other hyphen at a line end is
// kept, without the line break turning into a space.
const LINE_END_HYPHEN = /-\n/g
const WHITESPACE = /\s+/g
const BLANK = /\s/

const segmenters = new Map<string, Intl.Segmenter>()

function segmenterFor(locale: string) {
  let segmenter = segmenters.get(locale)
  if (!segmenter) {
    segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' })
    segmenters.set(locale, segmenter)
  }
  return segmenter
}

export interface SentenceBounds {
  // Index of the sentence's first character in `text`.
  start: number
  // Index just past its last character (whitespace around it excluded).
  end: number
}

// Where the sentence containing `offset` starts and ends in `text`, without
// the whitespace around it. Null for an offset outside the text or a blank
// stretch.
export function sentenceBounds(
  text: string,
  offset: number,
  locale = 'pt'
): SentenceBounds | null {
  if (offset < 0 || offset >= text.length) {
    return null
  }
  const flat = text.replace(LINE_BREAKS, ' ')
  const segment = segmenterFor(locale).segment(flat).containing(offset)
  if (!segment) {
    return null
  }
  let start = segment.index
  let end = start + segment.segment.length
  for (const mark of flat.slice(start, end).matchAll(FOOTNOTE_MARK)) {
    const cut = start + mark.index + mark[0].length
    if (offset < cut) {
      end = cut
      break
    }
    start = cut
  }
  while (start < end && BLANK.test(text.charAt(start))) {
    start++
  }
  while (end > start && BLANK.test(text.charAt(end - 1))) {
    end--
  }
  return start < end ? { start, end } : null
}

// A stretch of the page's text as one line, ready for the clipboard.
export function cleanSentence(raw: string): string {
  return raw
    .replace(WRAP_HYPHEN, '$1')
    .replace(LINE_END_HYPHEN, '-')
    .replace(WHITESPACE, ' ')
    .trim()
}

export function sentenceAt(
  text: string,
  offset: number,
  locale = 'pt'
): string | null {
  const bounds = sentenceBounds(text, offset, locale)
  return bounds ? cleanSentence(text.slice(bounds.start, bounds.end)) : null
}
