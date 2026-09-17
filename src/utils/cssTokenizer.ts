/**
 * CSS tokenizer that preserves strings, comments, urls, and punctuation.
 * Used as the foundation for safe format / minify / strip operations.
 */

export type CssTokenType =
  | 'whitespace'
  | 'comment'
  | 'string'
  | 'url'
  | 'at-keyword'
  | 'ident'
  | 'number'
  | 'hash'
  | 'delimiter'
  | 'brace-open'
  | 'brace-close'
  | 'paren-open'
  | 'paren-close'
  | 'bracket-open'
  | 'bracket-close'
  | 'semicolon'
  | 'colon'
  | 'comma'

export interface CssToken {
  type: CssTokenType
  value: string
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f'
}

function isIdentStart(ch: string): boolean {
  return /[a-zA-Z_\\]/.test(ch) || ch === '-' || ch.charCodeAt(0) >= 0x80
}

function isIdentChar(ch: string): boolean {
  return isIdentStart(ch) || /[0-9-]/.test(ch)
}

function readString(input: string, start: number, quote: string): { value: string; end: number } {
  let i = start + 1
  let value = quote
  while (i < input.length) {
    const ch = input[i]
    if (ch === '\\' && i + 1 < input.length) {
      value += ch + input[i + 1]
      i += 2
      continue
    }
    value += ch
    i++
    if (ch === quote) break
  }
  return { value, end: i }
}

function readComment(input: string, start: number): { value: string; end: number } {
  let i = start + 2
  let value = '/*'
  while (i < input.length) {
    if (input[i] === '*' && input[i + 1] === '/') {
      value += '*/'
      return { value, end: i + 2 }
    }
    value += input[i]
    i++
  }
  return { value, end: i }
}

function readUrl(input: string, start: number): { value: string; end: number } {
  // start points at 'u' of url(
  let i = start + 4 // after "url("
  let value = 'url('

  while (i < input.length && isWhitespace(input[i])) {
    value += input[i]
    i++
  }

  if (i < input.length && (input[i] === '"' || input[i] === "'")) {
    const quoted = readString(input, i, input[i])
    value += quoted.value
    i = quoted.end
    while (i < input.length && input[i] !== ')') {
      value += input[i]
      i++
    }
    if (i < input.length && input[i] === ')') {
      value += ')'
      i++
    }
    return { value, end: i }
  }

  while (i < input.length && input[i] !== ')' && input[i] !== '"' && input[i] !== "'") {
    if (input[i] === '\\' && i + 1 < input.length) {
      value += input[i] + input[i + 1]
      i += 2
      continue
    }
    // Stop at comment start inside unquoted url (rare / malformed)
    if (input[i] === '/' && input[i + 1] === '*') break
    value += input[i]
    i++
  }

  if (i < input.length && input[i] === ')') {
    value += ')'
    i++
  }

  return { value, end: i }
}

function readNumber(input: string, start: number): { value: string; end: number } {
  let i = start
  let value = ''

  if (input[i] === '+' || input[i] === '-') {
    value += input[i]
    i++
  }

  while (i < input.length && /[0-9.]/.test(input[i])) {
    value += input[i]
    i++
  }

  // scientific notation
  if ((input[i] === 'e' || input[i] === 'E') && /[0-9+-]/.test(input[i + 1] ?? '')) {
    value += input[i]
    i++
    if (input[i] === '+' || input[i] === '-') {
      value += input[i]
      i++
    }
    while (i < input.length && /[0-9]/.test(input[i])) {
      value += input[i]
      i++
    }
  }

  // unit or %
  if (i < input.length && input[i] === '%') {
    value += '%'
    i++
  } else if (i < input.length && isIdentStart(input[i])) {
    while (i < input.length && isIdentChar(input[i])) {
      value += input[i]
      i++
    }
  }

  return { value, end: i }
}

function readIdent(input: string, start: number): { value: string; end: number } {
  let i = start
  let value = ''
  while (i < input.length && isIdentChar(input[i])) {
    value += input[i]
    i++
  }
  return { value, end: i }
}

/**
 * Tokenize CSS into a stream that keeps strings, comments, and urls intact.
 */
export function tokenizeCss(input: string): CssToken[] {
  const tokens: CssToken[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    if (isWhitespace(ch)) {
      let value = ''
      while (i < input.length && isWhitespace(input[i])) {
        value += input[i]
        i++
      }
      tokens.push({ type: 'whitespace', value })
      continue
    }

    if (ch === '/' && input[i + 1] === '*') {
      const comment = readComment(input, i)
      tokens.push({ type: 'comment', value: comment.value })
      i = comment.end
      continue
    }

    if (ch === '"' || ch === "'") {
      const str = readString(input, i, ch)
      tokens.push({ type: 'string', value: str.value })
      i = str.end
      continue
    }

    // url( ... ) — case insensitive
    if (
      (ch === 'u' || ch === 'U') &&
      input.slice(i, i + 4).toLowerCase() === 'url(' &&
      (i === 0 || !isIdentChar(input[i - 1]))
    ) {
      const url = readUrl(input, i)
      tokens.push({ type: 'url', value: url.value })
      i = url.end
      continue
    }

    if (ch === '@') {
      let value = '@'
      i++
      while (i < input.length && isIdentChar(input[i])) {
        value += input[i]
        i++
      }
      tokens.push({ type: 'at-keyword', value })
      continue
    }

    if (ch === '#') {
      let value = '#'
      i++
      while (i < input.length && (isIdentChar(input[i]) || /[0-9a-fA-F]/.test(input[i]))) {
        value += input[i]
        i++
      }
      tokens.push({ type: 'hash', value })
      continue
    }

    if (ch === '{') {
      tokens.push({ type: 'brace-open', value: '{' })
      i++
      continue
    }
    if (ch === '}') {
      tokens.push({ type: 'brace-close', value: '}' })
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ type: 'paren-open', value: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'paren-close', value: ')' })
      i++
      continue
    }
    if (ch === '[') {
      tokens.push({ type: 'bracket-open', value: '[' })
      i++
      continue
    }
    if (ch === ']') {
      tokens.push({ type: 'bracket-close', value: ']' })
      i++
      continue
    }
    if (ch === ';') {
      tokens.push({ type: 'semicolon', value: ';' })
      i++
      continue
    }
    if (ch === ':') {
      tokens.push({ type: 'colon', value: ':' })
      i++
      continue
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',' })
      i++
      continue
    }

    // Numbers (including .5 and -10px) — bare "." is handled as a delimiter below
    if (
      /[0-9]/.test(ch) ||
      (ch === '.' && /[0-9]/.test(input[i + 1] ?? '')) ||
      (ch === '+' || ch === '-') &&
        (/[0-9]/.test(input[i + 1] ?? '') ||
          (input[i + 1] === '.' && /[0-9]/.test(input[i + 2] ?? '')))
    ) {
      const num = readNumber(input, i)
      tokens.push({ type: 'number', value: num.value })
      i = num.end
      continue
    }

    if (isIdentStart(ch)) {
      const start = i
      const ident = readIdent(input, i)
      if (ident.end <= start) {
        tokens.push({ type: 'delimiter', value: ch })
        i++
      } else {
        tokens.push({ type: 'ident', value: ident.value })
        i = ident.end
      }
      continue
    }

    // Operators / other punctuation (!, >, +, ~, *, =, ., etc.)
    tokens.push({ type: 'delimiter', value: ch })
    i++
  }

  return tokens
}

export function tokensToString(tokens: CssToken[]): string {
  return tokens.map((t) => t.value).join('')
}
