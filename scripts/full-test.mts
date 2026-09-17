/**
 * Full end-to-end functional verification of the CSS Formatter app logic.
 */
import { formatCss, stripComments } from '../src/utils/cssFormatter.ts'
import { minifyCss } from '../src/utils/cssMinifier.ts'
import { repairCss } from '../src/utils/cssRepair.ts'
import { computeMetrics, formatBytes } from '../src/utils/cssMetrics.ts'
import { SAMPLE_CSS } from '../src/utils/sampleCss.ts'
import { copyToClipboard, downloadTextFile, readCssFile, FileReadError } from '../src/utils/fileUtils.ts'

let failed = 0
let passed = 0

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function section(title: string) {
  console.log(`\n══ ${title} ══`)
}

section('1. Empty / edge input')
{
  assert('format empty', formatCss('', { indent: '2', stripComments: false }) === '')
  assert('minify empty', minifyCss('') === '')
  assert('strip empty', stripComments('') === '')
  const m = computeMetrics('')
  assert('metrics zero-safe', m.rawBytes === 0 && m.bandwidthSavedPercent === 0 && m.selectorCount === 0)
  const r = repairCss('')
  assert('repair empty', r.css === '' && r.repairs.length === 0)
}

section('2. Format — simple CSS (HiMat example)')
{
  const input = 'body{margin:0;padding:0;color:red}.card{padding:20px;background:white}'
  const out = formatCss(input, { indent: '2', stripComments: false })
  assert('body rule', out.includes('body {'))
  assert('2-space props', out.includes('  margin: 0;') && out.includes('  color: red;'))
  assert('card rule', out.includes('.card {'))
  assert('blank line between rules', /\}\n\n\.card/.test(out))

  const out4 = formatCss(input, { indent: '4', stripComments: false })
  assert('4 spaces', out4.includes('    margin: 0;'))

  const outTab = formatCss(input, { indent: 'tab', stripComments: false })
  assert('tab', outTab.includes('\tmargin: 0;'))

  const single = formatCss(input, { indent: 'single', stripComments: false })
  assert('single-line', single.includes('body {') && !single.includes('\n  margin'))
}

section('3. Format — media, variables, pseudo, URLs, strings')
{
  const input = `
:root{--primary:#2563eb}
.btn-primary:hover{background:url("/a.jpg");content:"/* not comment */"}
@media (max-width:768px){.card{padding:16px}}
`.trim()
  const out = formatCss(input, { indent: '2', stripComments: false })
  assert('custom props', out.includes('--primary: #2563eb') || out.includes('--primary:#2563eb') || out.includes('--primary: #2563eb;'))
  assert('pseudo preserved', out.includes(':hover'))
  assert('url preserved', out.includes('url("/a.jpg")'))
  assert('string comment-like kept', out.includes('"/* not comment */"'))
  assert('media formatted', out.includes('@media') && out.includes('max-width'))
}

section('4. Strip comments')
{
  const input = '/* remove me */ .a { color: red; /* inner */ } .b { content: "/* keep */"; background: url("x.com/*/y"); }'
  const stripped = stripComments(input)
  assert('outer comment gone', !stripped.includes('remove me'))
  assert('inner comment gone', !stripped.includes('inner'))
  assert('string safe', stripped.includes('"/* keep */"'))
  assert('url safe', stripped.includes('url("x.com/*/y")'))

  const formatted = formatCss(input, { indent: '2', stripComments: true })
  assert('format+strip', !formatted.includes('remove me') && formatted.includes('.a'))
}

section('5. Minifier')
{
  const input = `.card {\n  padding: 20px;\n  color: red;\n}\n`
  assert('classic minify', minifyCss(input) === '.card{padding:20px;color:red}')

  const calc = minifyCss('.a { width: calc(100% - 32px); color: var(--x, #fff); }')
  assert('calc spaces', calc.includes('calc(100% - 32px)'))
  assert('var kept', calc.includes('var(--x'))

  const media = minifyCss('@media (max-width: 768px) { .a { color: red; } }')
  assert('media minify', media.includes('@media') && media.includes('.a{color:red}'))

  const withComment = minifyCss('/* c */ .a { color: red; }')
  assert('comments stripped in minify', !withComment.includes('/*') && withComment === '.a{color:red}')

  const trailing = minifyCss('.a{color:red;}')
  assert('trailing semi before }', trailing === '.a{color:red}')
}

section('6. Auto-repair')
{
  const missingBrace = repairCss('.broken { color: red')
  assert('adds }', missingBrace.css.includes('}') && missingBrace.repairs.length > 0)

  const missingSemi = repairCss('.a { color: red }')
  assert('handles decls', missingSemi.css.includes('color: red'))

  const dup = repairCss('.a { color: red;; }')
  assert('dup semis cleaned or ok', dup.css.includes('color: red'))

  const safe = repairCss('.ok { margin: 0; }')
  assert('valid mostly unchanged', safe.css.includes('.ok') && safe.css.includes('margin'))
}

section('7. Live metrics (sample CSS)')
{
  const m = computeMetrics(SAMPLE_CSS)
  console.log(`     raw=${formatBytes(m.rawBytes)} min=${formatBytes(m.minifiedBytes)} saved=${m.bandwidthSavedPercent}% selectors=${m.selectorCount} decls=${m.declarationCount}`)
  assert('raw > 0', m.rawBytes > 0)
  assert('minified <= raw', m.minifiedBytes <= m.rawBytes)
  assert('bandwidth formula', m.bandwidthSavedPercent === Math.round(((m.rawBytes - m.minifiedBytes) / m.rawBytes) * 100))
  assert('selectors >= 5', m.selectorCount >= 5)
  assert('declarations >= 10', m.declarationCount >= 10)

  // Match reference ballpark for HiMat sample (~924 B / ~707 B / ~23%)
  assert('sample size ballpark', m.rawBytes > 700 && m.rawBytes < 1200)
  assert('sample savings ballpark', m.bandwidthSavedPercent >= 15 && m.bandwidthSavedPercent <= 40)
}

section('8. Sample CSS round-trip')
{
  const formatted = formatCss(SAMPLE_CSS, { indent: '2', stripComments: false })
  const minified = minifyCss(SAMPLE_CSS)
  assert('format sample non-empty', formatted.length > 100)
  assert('minify sample smaller', minified.length < SAMPLE_CSS.length)
  assert('keeps :root', formatted.includes(':root') && minified.includes(':root'))
  assert('keeps hover', formatted.includes(':hover') && minified.includes(':hover'))
  assert('keeps media', formatted.includes('@media') && minified.includes('@media'))
  assert('keeps vars', formatted.includes('--primary') && minified.includes('--primary'))

  // Switch indent without losing content semantics
  const tabbed = formatCss(SAMPLE_CSS, { indent: 'tab', stripComments: false })
  assert('indent switch preserves rules', tabbed.includes('.card') && tabbed.includes('.btn-primary'))
}

section('9. Clear semantics (simulated)')
{
  let input = SAMPLE_CSS
  input = ''
  const formatted = formatCss(input, { indent: '2', stripComments: false })
  const minified = minifyCss(input)
  const metrics = computeMetrics(input)
  assert('cleared format empty', formatted === '')
  assert('cleared minify empty', minified === '')
  assert('cleared metrics zero', metrics.rawBytes === 0 && metrics.selectorCount === 0)
}

section('10. File utils (API shape / errors)')
{
  assert('FileReadError exists', typeof FileReadError === 'function')
  assert('readCssFile is function', typeof readCssFile === 'function')
  assert('downloadTextFile is function', typeof downloadTextFile === 'function')
  assert('copyToClipboard is function', typeof copyToClipboard === 'function')

  // Simulate invalid extension rejection without DOM File if possible
  const fakeFile = {
    name: 'notes.txt',
    size: 10,
  } as File

  try {
    await readCssFile(fakeFile)
    assert('reject non-css', false, 'should have thrown')
  } catch (e) {
    assert('reject non-css', e instanceof FileReadError && /css/i.test((e as Error).message))
  }

  const emptyFile = { name: 'empty.css', size: 0 } as File
  try {
    await readCssFile(emptyFile)
    assert('reject empty', false, 'should have thrown')
  } catch (e) {
    assert('reject empty', e instanceof FileReadError && /empty/i.test((e as Error).message))
  }
}

section('11. Large CSS stress')
{
  const chunk = '.x{color:red;margin:0;padding:1px}'
  const large = chunk.repeat(2000) // ~60KB
  const t0 = Date.now()
  const formatted = formatCss(large, { indent: '2', stripComments: false })
  const minified = minifyCss(large)
  const metrics = computeMetrics(large)
  const ms = Date.now() - t0
  assert('large format ok', formatted.includes('.x') && formatted.includes('color: red'))
  assert('large minify ok', minified.includes('.x{color:red'))
  assert('large metrics', metrics.rawBytes > 50000 && metrics.selectorCount >= 2000)
  assert(`perf < 5s (${ms}ms)`, ms < 5000)
}

section('12. Malformed CSS must not throw')
{
  const garbage = ['{{{;;;', 'color:', '@media {', 'a{b:c', '/*', '"unterminated', "url(", null as unknown as string]
  for (const g of garbage) {
    try {
      if (g === null) continue
      formatCss(g, { indent: '2', stripComments: true })
      minifyCss(g)
      repairCss(g)
      computeMetrics(g)
      assert(`no throw: ${JSON.stringify(g).slice(0, 24)}`, true)
    } catch (e) {
      assert(`no throw: ${JSON.stringify(g).slice(0, 24)}`, false, String(e))
    }
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('ALL TESTS PASSED')
