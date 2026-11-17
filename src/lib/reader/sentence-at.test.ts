import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sentenceAt, sentenceBounds } from './sentence-at.ts'

const TEXT =
  'Primeira frase curta. Segunda frase\nquebrada em duas linhas! Terceira?'

describe('sentenceAt', () => {
  it('returns the sentence containing the offset', () => {
    assert.equal(sentenceAt(TEXT, 3), 'Primeira frase curta.')
  })

  it('joins a sentence split across lines', () => {
    const offset = TEXT.indexOf('quebrada')
    assert.equal(
      sentenceAt(TEXT, offset),
      'Segunda frase quebrada em duas linhas!'
    )
  })

  it('returns the last sentence', () => {
    assert.equal(sentenceAt(TEXT, TEXT.length - 1), 'Terceira?')
  })

  it('removes the hyphen of a word wrapped at a line end', () => {
    const text = 'O sistema mono-\nlítico cresceu. Fim.'
    assert.equal(sentenceAt(text, 2), 'O sistema monolítico cresceu.')
  })

  it('keeps a real hyphen before an uppercase word', () => {
    const text = 'Use o padrão Strangler-\nFig aqui.'
    assert.equal(sentenceAt(text, 0), 'Use o padrão Strangler-Fig aqui.')
  })

  it('returns null for an offset outside the text', () => {
    assert.equal(sentenceAt(TEXT, -1), null)
    assert.equal(sentenceAt(TEXT, TEXT.length), null)
    assert.equal(sentenceAt('', 0), null)
  })

  it('returns null for whitespace only', () => {
    assert.equal(sentenceAt('   \n  ', 2), null)
  })
})

describe('sentenceBounds', () => {
  it('excludes the whitespace around the sentence', () => {
    const bounds = sentenceBounds(TEXT, TEXT.indexOf('Segunda'))
    assert.ok(bounds)
    assert.equal(
      TEXT.slice(bounds.start, bounds.end),
      'Segunda frase\nquebrada em duas linhas!'
    )
  })

  it('returns null outside the text', () => {
    assert.equal(sentenceBounds(TEXT, TEXT.length), null)
  })
})

describe('footnotes and headings', () => {
  const text =
    'We use it day to day.9 Domain coupling\n\nFundamentally, there is more.'

  it('cuts after a footnote number glued to the full stop', () => {
    assert.equal(sentenceAt(text, 2), 'We use it day to day.9')
  })

  it('cuts a heading off at a paragraph break', () => {
    assert.equal(sentenceAt(text, text.indexOf('Domain')), 'Domain coupling')
    assert.equal(
      sentenceAt(text, text.indexOf('Fundamentally')),
      'Fundamentally, there is more.'
    )
  })
})
