import { tokenizeCss, tokensToString, type CssToken } from './cssTokenizer'

export interface RepairResult {
  css: string
  repairs: string[]
}

/**
 * Attempt safe, conservative repairs for common CSS issues.
 * If a fix cannot be applied safely, original content is preserved.
 */
export function repairCss(input: string): RepairResult {
  if (!input.trim()) {
    return { css: '', repairs: [] }
  }

  const repairs: string[] = []
  let tokens = tokenizeCss(input)

  // 1. Normalize excessive whitespace around selectors / braces (outside strings)
  tokens = normalizeSpacing(tokens, repairs)

  // 2. Insert missing semicolons before closing braces when a declaration looks incomplete
  tokens = insertMissingSemicolons(tokens, repairs)

  // 3. Balance missing closing braces
  tokens = balanceBraces(tokens, repairs)

  // 4. Remove empty extra semicolons that are clearly redundant (;; )
  tokens = collapseDuplicateSemicolons(tokens, repairs)

  return {
    css: tokensToString(tokens),
    repairs,
  }
}

function normalizeSpacing(tokens: CssToken[], repairs: string[]): CssToken[] {
  const out: CssToken[] = []
  let changed = false

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type === 'whitespace') {
      // Collapse runs of whitespace to a single space (preserve at least one newline intent as space)
      const next = tokens[i + 1]
      const prev = out[out.length - 1]

      if (!prev || !next) continue
      if (
        prev.type === 'brace-open' ||
        prev.type === 'brace-close' ||
        prev.type === 'semicolon' ||
        next.type === 'brace-close' ||
        next.type === 'semicolon'
      ) {
        // Drop space before } or ; and after { or ;
        // Keep newline-ish separation as single space only when useful later for formatting
        if (next.type === 'brace-close' || next.type === 'semicolon') {
          if (token.value.length > 0) changed = true
          continue
        }
        if (prev.type === 'brace-open' || prev.type === 'semicolon') {
          // Keep one space or newline collapsed — actually keep nothing; formatter will indent
          if (/\S/.test(token.value) === false && token.value.includes('\n')) {
            // keep a single newline marker as whitespace space for readability of unrepaired view
            out.push({ type: 'whitespace', value: '\n' })
          }
          continue
        }
      }

      // Collapse multiple spaces/tabs/newlines to single space (or single newline if present)
      const collapsed = token.value.includes('\n') ? '\n' : ' '
      if (token.value !== collapsed) changed = true
      if (prev.type === 'whitespace') continue
      out.push({ type: 'whitespace', value: collapsed })
      continue
    }

    // Space around combinators if missing: "div>p" -> "div > p" (safe readability fix)
    if (
      token.type === 'delimiter' &&
      (token.value === '>' || token.value === '+' || token.value === '~')
    ) {
      const prev = out[out.length - 1]
      if (prev && prev.type !== 'whitespace' && prev.type !== 'bracket-open') {
        out.push({ type: 'whitespace', value: ' ' })
        changed = true
      }
      out.push(token)
      const next = tokens[i + 1]
      if (next && next.type !== 'whitespace' && next.type !== 'bracket-close') {
        out.push({ type: 'whitespace', value: ' ' })
        changed = true
        // skip if next is already whitespace? we add and continue
      }
      continue
    }

    out.push(token)
  }

  if (changed) repairs.push('Normalized spacing around selectors and braces')
  return out
}

function insertMissingSemicolons(tokens: CssToken[], repairs: string[]): CssToken[] {
  const out: CssToken[] = []
  let depth = 0
  let paren = 0
  let bracket = 0
  let sawColonInDecl = false
  let inserted = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type === 'paren-open') paren++
    if (token.type === 'paren-close') paren = Math.max(0, paren - 1)
    if (token.type === 'bracket-open') bracket++
    if (token.type === 'bracket-close') bracket = Math.max(0, bracket - 1)

    if (token.type === 'brace-open') {
      depth++
      sawColonInDecl = false
      out.push(token)
      continue
    }

    if (token.type === 'brace-close') {
      // If we're inside a rule and saw a property colon without semicolon, insert one
      if (depth > 0 && paren === 0 && bracket === 0 && sawColonInDecl) {
        const prevMeaningful = lastMeaningful(out)
        if (
          prevMeaningful &&
          prevMeaningful.type !== 'semicolon' &&
          prevMeaningful.type !== 'brace-open' &&
          prevMeaningful.type !== 'brace-close'
        ) {
          out.push({ type: 'semicolon', value: ';' })
          inserted++
        }
      }
      depth = Math.max(0, depth - 1)
      sawColonInDecl = false
      out.push(token)
      continue
    }

    if (token.type === 'semicolon') {
      sawColonInDecl = false
      out.push(token)
      continue
    }

    if (token.type === 'colon' && depth > 0 && paren === 0 && bracket === 0) {
      // Could be property or pseudo — check if previous meaningful is ident (property name)
      const prev = lastMeaningful(out)
      if (prev && (prev.type === 'ident' || prev.type === 'delimiter')) {
        // Heuristic: property declarations use ident before colon inside blocks.
        // Pseudo-elements use :: or :hover after selector — those appear before brace-open.
        // Inside block after { or ;, colon after ident is property.
        const context = declarationContext(out)
        if (context === 'property') {
          sawColonInDecl = true
        }
      }
      out.push(token)
      continue
    }

    out.push(token)
  }

  if (inserted > 0) {
    repairs.push(`Inserted ${inserted} missing semicolon${inserted === 1 ? '' : 's'}`)
  }
  return out
}

function declarationContext(tokens: CssToken[]): 'property' | 'selector' | 'unknown' {
  // Walk back to nearest { or ; or }
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i]
    if (t.type === 'whitespace' || t.type === 'comment') continue
    if (t.type === 'brace-open' || t.type === 'semicolon') return 'property'
    if (t.type === 'brace-close') return 'selector'
    if (t.type === 'colon') {
      // already in value or pseudo
      return 'unknown'
    }
  }
  return 'selector'
}

function balanceBraces(tokens: CssToken[], repairs: string[]): CssToken[] {
  let open = 0
  let close = 0
  for (const t of tokens) {
    if (t.type === 'brace-open') open++
    if (t.type === 'brace-close') close++
  }

  if (open === close) return tokens

  const out = [...tokens]

  if (open > close) {
    const missing = open - close
    for (let i = 0; i < missing; i++) {
      out.push({ type: 'brace-close', value: '}' })
    }
    repairs.push(`Added ${missing} missing closing brace${missing === 1 ? '' : 's'}`)
  } else {
    // More closing than opening — do not strip user's braces (unsafe). Preserve content.
    repairs.push('Detected extra closing braces — left unchanged to avoid data loss')
  }

  return out
}

function collapseDuplicateSemicolons(tokens: CssToken[], repairs: string[]): CssToken[] {
  const out: CssToken[] = []
  let removed = 0

  for (const token of tokens) {
    if (token.type === 'semicolon') {
      const prev = lastMeaningful(out)
      if (prev?.type === 'semicolon') {
        removed++
        continue
      }
    }
    out.push(token)
  }

  if (removed > 0) {
    repairs.push(`Removed ${removed} duplicate semicolon${removed === 1 ? '' : 's'}`)
  }
  return out
}

function lastMeaningful(tokens: CssToken[]): CssToken | null {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].type !== 'whitespace' && tokens[i].type !== 'comment') return tokens[i]
  }
  return null
}
