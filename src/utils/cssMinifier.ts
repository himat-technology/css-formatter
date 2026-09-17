import { tokenizeCss, type CssToken } from './cssTokenizer'

/**
 * Minify CSS safely — removes comments and unnecessary whitespace
 * while preserving strings, urls, calc(), var(), and attribute selectors.
 */
export function minifyCss(input: string): string {
  if (!input.trim()) return ''

  const tokens = tokenizeCss(input).filter((t) => t.type !== 'comment')
  let result = ''
  let parenDepth = 0
  let bracketDepth = 0

  const lastChar = () => (result.length ? result[result.length - 1] : '')

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const prev = previousMeaningful(tokens, i)
    const next = nextMeaningful(tokens, i)

    switch (token.type) {
      case 'whitespace': {
        if (!result) break
        if (!next) break

        // Keep space only when semantically required
        if (needsSpace(prev, next, parenDepth, bracketDepth, lastChar())) {
          if (lastChar() !== ' ') result += ' '
        }
        break
      }

      case 'brace-open': {
        // Drop space before {
        if (lastChar() === ' ') result = result.slice(0, -1)
        result += '{'
        break
      }

      case 'brace-close': {
        // Remove trailing semicolon before }
        if (lastChar() === ';') result = result.slice(0, -1)
        if (lastChar() === ' ') result = result.slice(0, -1)
        result += '}'
        break
      }

      case 'semicolon': {
        // Skip trailing semicolon before }
        if (next?.type === 'brace-close') break
        // Skip duplicate semicolons
        if (lastChar() === ';') break
        if (lastChar() === ' ') result = result.slice(0, -1)
        result += ';'
        break
      }

      case 'colon': {
        if (lastChar() === ' ') result = result.slice(0, -1)
        result += ':'
        break
      }

      case 'comma': {
        if (lastChar() === ' ') result = result.slice(0, -1)
        result += ','
        break
      }

      case 'paren-open': {
        if (lastChar() === ' ') {
          // Keep space for at-rules like @media ( but not for functions like calc(
          if (prev && isFunctionName(prev)) {
            result = result.slice(0, -1)
          }
        }
        result += '('
        parenDepth++
        break
      }

      case 'paren-close': {
        if (lastChar() === ' ') result = result.slice(0, -1)
        result += ')'
        parenDepth = Math.max(0, parenDepth - 1)
        break
      }

      case 'bracket-open': {
        if (lastChar() === ' ') {
          // attribute selectors attach to ident: div[attr]
          if (prev?.type === 'ident' || prev?.type === 'hash' || prev?.type === 'delimiter') {
            result = result.slice(0, -1)
          }
        }
        result += '['
        bracketDepth++
        break
      }

      case 'bracket-close': {
        if (lastChar() === ' ') result = result.slice(0, -1)
        result += ']'
        bracketDepth = Math.max(0, bracketDepth - 1)
        break
      }

      default: {
        result += token.value
        break
      }
    }
  }

  return result.trim()
}

function previousMeaningful(tokens: CssToken[], index: number): CssToken | null {
  for (let i = index - 1; i >= 0; i--) {
    if (tokens[i].type !== 'whitespace' && tokens[i].type !== 'comment') return tokens[i]
  }
  return null
}

function nextMeaningful(tokens: CssToken[], index: number): CssToken | null {
  for (let i = index + 1; i < tokens.length; i++) {
    if (tokens[i].type !== 'whitespace' && tokens[i].type !== 'comment') return tokens[i]
  }
  return null
}

function isFunctionName(token: CssToken): boolean {
  if (token.type !== 'ident') return false
  // Common CSS functions — also treat any ident followed by ( as function
  return true
}

function needsSpace(
  prev: CssToken | null,
  next: CssToken | null,
  parenDepth: number,
  bracketDepth: number,
  last: string,
): boolean {
  if (!prev || !next) return false

  // Never space before/after these
  const noSpaceBefore = new Set([
    'brace-open',
    'brace-close',
    'semicolon',
    'comma',
    'colon',
    'paren-close',
    'bracket-close',
  ])
  const noSpaceAfter = new Set([
    'brace-open',
    'semicolon',
    'colon',
    'comma',
    'paren-open',
    'bracket-open',
  ])

  if (noSpaceBefore.has(next.type)) return false
  if (noSpaceAfter.has(prev.type)) return false

  // Combinators need spaces: div > p, div + p
  if (prev.type === 'delimiter' && '> +~'.includes(prev.value)) return true
  if (next.type === 'delimiter' && '> +~'.includes(next.value)) return true

  // !important
  if (next.type === 'delimiter' && next.value === '!') return true
  if (prev.type === 'delimiter' && prev.value === '!') return false

  // calc / math operators inside parens
  if (parenDepth > 0) {
    if (prev.type === 'delimiter' && '+-*/'.includes(prev.value)) return true
    if (next.type === 'delimiter' && '+-*/'.includes(next.value)) return true
  }

  // Attribute selectors: [type="text"] — usually no spaces needed around =
  if (bracketDepth > 0) {
    if (prev.type === 'delimiter' || next.type === 'delimiter') return false
    if (prev.type === 'ident' && next.type === 'string') return false
    return false
  }

  // @media screen and (min-width: 768px)
  if (prev.type === 'ident' && next.type === 'ident') return true
  if (prev.type === 'at-keyword' && (next.type === 'ident' || next.type === 'paren-open')) {
    return next.type === 'ident'
  }
  if (prev.type === 'number' && next.type === 'ident') {
    // 1px — number token usually includes unit; if separate, no space for units but space for "and"
    return true
  }

  if (prev.type === 'paren-close' && next.type === 'ident') return true
  if (prev.type === 'paren-close' && next.type === 'brace-open') return false

  // hash/class attach: no space after . or #
  if (prev.type === 'delimiter' && (prev.value === '.' || prev.value === '#' || prev.value === '*')) {
    return false
  }

  // Default word boundary
  const wordish = (t: CssToken) =>
    t.type === 'ident' ||
    t.type === 'hash' ||
    t.type === 'number' ||
    t.type === 'string' ||
    t.type === 'url' ||
    t.type === 'at-keyword'

  if (wordish(prev) && wordish(next)) return true

  void last
  return false
}
