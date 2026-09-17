import { formatCss } from '../src/utils/cssFormatter.ts'
import { minifyCss } from '../src/utils/cssMinifier.ts'
import { repairCss } from '../src/utils/cssRepair.ts'
import { computeMetrics } from '../src/utils/cssMetrics.ts'
import { SAMPLE_CSS } from '../src/utils/sampleCss.ts'

const formatted = formatCss(SAMPLE_CSS, { indent: '2', stripComments: false })
const minified = minifyCss(SAMPLE_CSS)
const repaired = repairCss('.x{color:red')
const metrics = computeMetrics(SAMPLE_CSS)

console.log('FORMATTED:\n' + formatted.slice(0, 450) + '\n...')
console.log('\nMINIFIED:\n' + minified)
console.log('\nREPAIR:', repaired)
console.log('\nMETRICS:', metrics)
