import { tokenizeCss, type CssToken } from './cssTokenizer'

export type IndentStyle = '2' | '4' | 'tab' | 'single'

export interface FormatOptions {
  indent: IndentStyle
  stripComments: boolean
}

type EmitState = {
  depth: number
  paren: number
  bracket: number
  /** Inside a style rule body (between { and }), awaiting property name */
  inRuleBody: boolean
  /** Saw property name colon; next tokens are the value */
  inValue: boolean
  singleLine: boolean
  indentUnit: string
  result: string
}

function getIndentUnit(style: IndentStyle): string {
  switch (style) {
    case '2':
      return '  '
    case '4':
      return '    '
    case 'tab':
      return '\t'
    case 'single':
      return ''
  }
}

function indentOf(state: EmitState): string {
  if (state.singleLine) return ''
  return state.indentUnit.repeat(Math.max(0, state.depth))
}

function endsWithNewline(s: string): boolean {
  return s.endsWith('\n')
}

function trimTrailingSpace(s: string): string {
  return s.replace(/[ \t]+$/, '')
}

function ensureNewline(state: EmitState): void {
  if (state.singleLine) {
    if (state.result && !state.result.endsWith(' ')) state.result += ' '
    return
  }
  state.result = trimTrailingSpace(state.result)
  if (state.result && !endsWithNewline(state.result)) state.result += '\n'
}

function startLine(state: EmitState): void {
  ensureNewline(state)
  if (!state.singleLine) state.result += indentOf(state)
}

function meaningfulPrev(tokens: CssToken[], index: number): CssToken | null {
  for (let i = index - 1; i >= 0; i--) {
    if (tokens[i].type !== 'whitespace' && tokens[i].type !== 'comment') return tokens[i]
  }
  return null
}

function meaningfulNext(tokens: CssToken[], index: number): CssToken | null {
  for (let i = index + 1; i < tokens.length; i++) {
    if (tokens[i].type !== 'whitespace' && tokens[i].type !== 'comment') return tokens[i]
  }
  return null
}

/**
 * Format / beautify CSS with configurable indentation.
 */
export function formatCss(input: string, options: FormatOptions): string {
  if (!input.trim()) return ''

  let tokens = tokenizeCss(input)
  if (options.stripComments) {
    tokens = tokens.filter((t) => t.type !== 'comment')
  }

  const state: EmitState = {
    depth: 0,
    paren: 0,
    bracket: 0,
    inRuleBody: false,
    inValue: false,
    singleLine: options.indent === 'single',
    indentUnit: getIndentUnit(options.indent),
    result: '',
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'whitespace') continue

    const prev = meaningfulPrev(tokens, i)
    const next = meaningfulNext(tokens, i)

    switch (token.type) {
      case 'comment': {
        if (state.result && !state.singleLine && !endsWithNewline(state.result)) {
          state.result += '\n'
        }
        if (!state.singleLine) state.result += indentOf(state)
        else if (state.result && !state.result.endsWith(' ')) state.result += ' '
        state.result += token.value
        ensureNewline(state)
        break
      }

      case 'brace-open': {
        state.result = trimTrailingSpace(state.result)
        if (state.result && !/\s$/.test(state.result)) state.result += ' '
        state.result += '{'
        state.depth++
        state.inRuleBody = true
        state.inValue = false
        if (state.singleLine) state.result += ' '
        else state.result += '\n'
        break
      }

      case 'brace-close': {
        // Ensure last declaration in a block ends with a semicolon
        if (state.inRuleBody && state.inValue) {
          state.result = trimTrailingSpace(state.result)
          if (!state.result.endsWith(';')) state.result += ';'
          state.inValue = false
        }
        state.depth = Math.max(0, state.depth - 1)
        state.result = trimTrailingSpace(state.result)
        if (!state.singleLine && state.result && !endsWithNewline(state.result)) {
          state.result += '\n'
        }
        if (!state.singleLine) state.result += indentOf(state)
        state.result += '}'

        state.inRuleBody = state.depth > 0

        if (next) {
          if (next.type === 'brace-close') {
            ensureNewline(state)
          } else if (next.type === 'comment') {
            ensureNewline(state)
          } else if (state.singleLine) {
            state.result += ' '
          } else {
            state.result += '\n\n'
          }
        } else if (!state.singleLine) {
          state.result += '\n'
        }
        break
      }

      case 'semicolon': {
        state.result = trimTrailingSpace(state.result)
        state.result += ';'
        state.inValue = false
        if (state.singleLine) {
          if (next && next.type !== 'brace-close') state.result += ' '
        } else {
          state.result += '\n'
        }
        break
      }

      case 'colon': {
        // Property colon vs pseudo-class/element
        const isPropertyColon =
          state.inRuleBody &&
          !state.inValue &&
          state.paren === 0 &&
          state.bracket === 0 &&
          prev !== null &&
          (prev.type === 'ident' || (prev.type === 'delimiter' && prev.value === '*'))

        if (isPropertyColon) {
          state.result += ': '
          state.inValue = true
        } else {
          state.result += ':'
        }
        break
      }

      case 'comma': {
        state.result = trimTrailingSpace(state.result)
        state.result += ','
        if (state.paren > 0 || state.bracket > 0 || state.inValue) {
          state.result += ' '
        } else if (state.singleLine) {
          state.result += ' '
        } else {
          // Selector list — break line
          state.result += '\n' + indentOf(state)
        }
        break
      }

      case 'paren-open': {
        // Remove space before ( for functions: calc (
        if (prev?.type === 'ident' && state.result.endsWith(' ')) {
          state.result = state.result.slice(0, -1)
        }
        state.result += '('
        state.paren++
        break
      }

      case 'paren-close': {
        state.result = trimTrailingSpace(state.result)
        state.result += ')'
        state.paren = Math.max(0, state.paren - 1)
        break
      }

      case 'bracket-open': {
        if (state.result.endsWith(' ')) state.result = state.result.slice(0, -1)
        state.result += '['
        state.bracket++
        break
      }

      case 'bracket-close': {
        state.result = trimTrailingSpace(state.result)
        state.result += ']'
        state.bracket = Math.max(0, state.bracket - 1)
        break
      }

      case 'at-keyword': {
        if (state.result && !state.singleLine) {
          if (!endsWithNewline(state.result)) state.result += '\n'
          // Extra blank line before top-level at-rules when content exists
          if (state.depth === 0 && state.result.trim() && !state.result.endsWith('\n\n')) {
            // keep single newline from above
          }
        }
        startLine(state)
        state.result += token.value
        break
      }

      default: {
        emitValueToken(state, token, prev, next)
        break
      }
    }
  }

  let out = state.result.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (out && !state.singleLine) out += '\n'
  return out
}

function emitValueToken(
  state: EmitState,
  token: CssToken,
  prev: CssToken | null,
  next: CssToken | null,
): void {
  const atLineStart =
    !state.result ||
    endsWithNewline(state.result) ||
    (state.singleLine && (state.result.endsWith('{ ') || state.result.endsWith('; ')))

  if (!state.singleLine && (endsWithNewline(state.result) || state.result === '')) {
    state.result += indentOf(state)
  } else if (needsSpaceBeforeToken(state, token, prev)) {
    if (!state.result.endsWith(' ')) state.result += ' '
  } else if (atLineStart && state.singleLine && state.result && !state.result.endsWith(' ')) {
    // already spaced after { or ;
  }

  state.result += token.value
  void next
}

function needsSpaceBeforeToken(state: EmitState, token: CssToken, prev: CssToken | null): boolean {
  if (!state.result || !prev) return false
  const last = state.result[state.result.length - 1]
  if (last === ' ' || last === '\n' || last === '\t') return false
  if ('({:;[,#@'.includes(last)) return false

  // Combinators
  if (token.type === 'delimiter' && '> +~'.includes(token.value)) return true
  if (prev.type === 'delimiter' && '> +~'.includes(prev.value)) return true

  // !important
  if (token.type === 'delimiter' && token.value === '!') return true
  if (prev.type === 'delimiter' && prev.value === '!') return false

  // .class #id attach
  if (token.type === 'delimiter' && (token.value === '.' || token.value === '#' || token.value === '*')) {
    return false
  }
  if (prev.type === 'delimiter' && (prev.value === '.' || prev.value === '#' || prev.value === '*' || prev.value === '-')) {
    if (token.type === 'ident' || token.type === 'number') return false
  }

  // Attribute / function interiors
  if (state.bracket > 0) {
    if (prev.type === 'delimiter' || token.type === 'delimiter') return false
    return false
  }

  if (state.paren > 0) {
    if (token.type === 'delimiter' && '+-*/'.includes(token.value)) return true
    if (prev.type === 'delimiter' && '+-*/'.includes(prev.value)) return true
    if (
      (prev.type === 'ident' || prev.type === 'number' || prev.type === 'string' || prev.type === 'url') &&
      (token.type === 'ident' || token.type === 'number' || token.type === 'string' || token.type === 'url')
    ) {
      return true
    }
    return false
  }

  // After closing paren before brace already handled; space before ident after )
  if (prev.type === 'paren-close' && (token.type === 'ident' || token.type === 'hash')) return true

  const wordish = (t: CssToken) =>
    t.type === 'ident' ||
    t.type === 'hash' ||
    t.type === 'number' ||
    t.type === 'string' ||
    t.type === 'url' ||
    t.type === 'at-keyword'

  if (wordish(prev) && wordish(token)) return true

  // Space after ) before { handled by brace-open
  return false
}

/**
 * Strip CSS comments without touching comment-like text inside strings or urls.
 */
export function stripComments(input: string): string {
  if (!input) return ''
  const tokens = tokenizeCss(input).filter((t) => t.type !== 'comment')
  return tokens
    .map((t) => t.value)
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
}
