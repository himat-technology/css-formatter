import { tokenizeCss } from './cssTokenizer'
import { minifyCss } from './cssMinifier'

export interface CssMetrics {
  rawBytes: number
  minifiedBytes: number
  bandwidthSavedPercent: number
  selectorCount: number
  declarationCount: number
}

/**
 * Compute live stylesheet statistics from the user's CSS.
 */
export function computeMetrics(input: string): CssMetrics {
  const rawBytes = new TextEncoder().encode(input).length

  if (rawBytes === 0) {
    return {
      rawBytes: 0,
      minifiedBytes: 0,
      bandwidthSavedPercent: 0,
      selectorCount: 0,
      declarationCount: 0,
    }
  }

  let minified: string
  try {
    minified = minifyCss(input)
  } catch {
    minified = input.replace(/\s+/g, ' ').trim()
  }

  const minifiedBytes = new TextEncoder().encode(minified).length
  const bandwidthSavedPercent =
    rawBytes === 0 ? 0 : Math.max(0, Math.round(((rawBytes - minifiedBytes) / rawBytes) * 100))

  const { selectorCount, declarationCount } = countRules(input)

  return {
    rawBytes,
    minifiedBytes,
    bandwidthSavedPercent,
    selectorCount,
    declarationCount,
  }
}

/**
 * Count rule selectors and property declarations using a brace-aware walk.
 */
function countRules(input: string): { selectorCount: number; declarationCount: number } {
  if (!input.trim()) return { selectorCount: 0, declarationCount: 0 }

  const tokens = tokenizeCss(input)
  let selectorCount = 0
  let declarationCount = 0
  let depth = 0
  let paren = 0
  let bracket = 0
  let sawColon = false
  let commasInSelector = 0
  let inAtRulePrelude = false

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]

    if (t.type === 'paren-open') paren++
    if (t.type === 'paren-close') paren = Math.max(0, paren - 1)
    if (t.type === 'bracket-open') bracket++
    if (t.type === 'bracket-close') bracket = Math.max(0, bracket - 1)

    if (t.type === 'at-keyword' && paren === 0 && bracket === 0) {
      inAtRulePrelude = true
      continue
    }

    if (t.type === 'semicolon' && inAtRulePrelude && depth === 0) {
      // @import url(...);
      inAtRulePrelude = false
      commasInSelector = 0
      continue
    }

    if (t.type === 'brace-open' && paren === 0 && bracket === 0) {
      if (!inAtRulePrelude) {
        selectorCount += commasInSelector + 1
      } else {
        inAtRulePrelude = false
      }
      depth++
      commasInSelector = 0
      sawColon = false
      continue
    }

    if (t.type === 'brace-close' && paren === 0 && bracket === 0) {
      depth = Math.max(0, depth - 1)
      sawColon = false
      commasInSelector = 0
      continue
    }

    if (t.type === 'comma' && paren === 0 && bracket === 0 && !inAtRulePrelude) {
      if (!isInsideDeclaration(tokens, i, depth)) {
        commasInSelector++
      }
      continue
    }

    if (t.type === 'colon' && depth > 0 && paren === 0 && bracket === 0) {
      // Property declaration colon (not pseudo in selector — selectors are before {)
      // Inside rule body, first colon on a statement starts a declaration
      if (!sawColon && looksLikePropertyColon(tokens, i)) {
        declarationCount++
        sawColon = true
      }
      continue
    }

    if (t.type === 'semicolon' && depth > 0) {
      sawColon = false
      continue
    }
  }

  return { selectorCount, declarationCount }
}

function isInsideDeclaration(tokens: ReturnType<typeof tokenizeCss>, index: number, depth: number): boolean {
  if (depth === 0) return false
  // Look back for colon before semicolon/{ 
  for (let i = index - 1; i >= 0; i--) {
    const t = tokens[i]
    if (t.type === 'semicolon' || t.type === 'brace-open') return false
    if (t.type === 'brace-close') return false
    if (t.type === 'colon') return true
  }
  return false
}

function looksLikePropertyColon(tokens: ReturnType<typeof tokenizeCss>, colonIndex: number): boolean {
  // Previous meaningful should be a property name (ident), not a pseudo
  for (let i = colonIndex - 1; i >= 0; i--) {
    const t = tokens[i]
    if (t.type === 'whitespace' || t.type === 'comment') continue
    if (t.type === 'ident') {
      // Check it's not double-colon pseudo already handled
      return true
    }
    if (t.type === 'delimiter' && t.value === '*') return true // *zoom IE hack
    if (t.type === 'colon') return false // ::pseudo
    return false
  }
  return false
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
