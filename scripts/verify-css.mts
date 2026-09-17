/**
 * Quick verification of CSS format / minify / repair / metrics.
 * Run: npx tsx scripts/verify-css.mts
 */
import { formatCss } from '../src/utils/cssFormatter.ts'
import { minifyCss } from '../src/utils/cssMinifier.ts'
import { repairCss } from '../src/utils/cssRepair.ts'
import { computeMetrics } from '../src/utils/cssMetrics.ts'
import { stripComments } from '../src/utils/cssFormatter.ts'

let failed = 0

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('Formatting')
{
  const input = 'body{margin:0;padding:0;color:red}.card{padding:20px;background:white}'
  const out2 = formatCss(input, { indent: '2', stripComments: false })
  assert('2-space indent present', out2.includes('  margin: 0;'))
  assert('rule separation', out2.includes('}\n\n.card'))
  assert('property spacing', out2.includes('color: red;'))

  const out4 = formatCss(input, { indent: '4', stripComments: false })
  assert('4-space indent', out4.includes('    margin: 0;'))

  const outTab = formatCss(input, { indent: 'tab', stripComments: false })
  assert('tab indent', outTab.includes('\tmargin: 0;'))

  const outSingle = formatCss(input, { indent: 'single', stripComments: false })
  assert('single-line keeps braces', outSingle.includes('body {') && outSingle.includes('margin: 0;'))
}

console.log('Comments / strings')
{
  const input = '/* keep? */ .a { content: "/* not a comment */"; background: url("http://x.com/*/y"); }'
  const stripped = stripComments(input)
  assert('comment removed', !stripped.includes('/* keep? */'))
  assert('string preserved', stripped.includes('"/* not a comment */"'))
  assert('url preserved', stripped.includes('url("http://x.com/*/y")'))
}

console.log('Minification')
{
  const input = `.card {\n  padding: 20px;\n  color: red;\n}\n`
  const out = minifyCss(input)
  assert('minified shape', out === '.card{padding:20px;color:red}')

  const calc = minifyCss('.a{width:calc(100% - 32px);color:var(--x, #fff)}')
  assert('calc spaces kept', calc.includes('calc(100% - 32px)'))
  assert('var preserved', calc.includes('var(--x,#fff)') || calc.includes('var(--x, #fff)'))

  const media = minifyCss('@media (max-width: 768px) { .a { color: red; } }')
  assert('media query', media.includes('@media') && media.includes('(max-width:768px)'))
}

console.log('Auto-repair')
{
  const { css, repairs } = repairCss('.broken { color: red')
  assert('added closing brace', css.includes('}'))
  assert('reported repair', repairs.length > 0)

  const semi = repairCss('.a { color: red }')
  assert('semicolon inserted or already ok', semi.css.includes('color: red'))
}

console.log('Metrics')
{
  const m0 = computeMetrics('')
  assert('zero input safe', m0.rawBytes === 0 && m0.bandwidthSavedPercent === 0)

  const sample = 'body{margin:0}.card{padding:20px;color:red}'
  const m = computeMetrics(sample)
  assert('raw bytes > 0', m.rawBytes > 0)
  assert('minified <= raw', m.minifiedBytes <= m.rawBytes)
  assert('selectors counted', m.selectorCount >= 2)
  assert('declarations counted', m.declarationCount >= 3)
}

console.log('Media / variables / pseudo')
{
  const input = `:root{--a:1px}a:hover{color:red}@media screen and (min-width:600px){.x{margin:var(--a)}}`
  const formatted = formatCss(input, { indent: '2', stripComments: false })
  assert('formats media', formatted.includes('@media'))
  assert('formats pseudo', formatted.includes(':hover'))
  assert('formats var', formatted.includes('var(--a)'))
  const mini = minifyCss(formatted)
  assert('minifies without crash', mini.length > 0 && mini.includes(':root'))
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
