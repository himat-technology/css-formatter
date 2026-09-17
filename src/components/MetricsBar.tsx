import { formatBytes, type CssMetrics } from '../utils/cssMetrics'

interface MetricsBarProps {
  metrics: CssMetrics
}

const ITEMS: {
  key: keyof CssMetrics | 'bandwidth'
  label: string
  tone: string
  format: (m: CssMetrics) => string
}[] = [
  {
    key: 'rawBytes',
    label: 'Raw Byte Size',
    tone: 'tone-blue',
    format: (m) => formatBytes(m.rawBytes),
  },
  {
    key: 'minifiedBytes',
    label: 'Minified Size',
    tone: 'tone-cyan',
    format: (m) => formatBytes(m.minifiedBytes),
  },
  {
    key: 'bandwidth',
    label: 'Bandwidth Saved',
    tone: 'tone-green',
    format: (m) => (m.rawBytes === 0 ? '—' : `${m.bandwidthSavedPercent}%`),
  },
  {
    key: 'selectorCount',
    label: 'CSS Rule Selectors',
    tone: 'tone-amber',
    format: (m) => String(m.selectorCount),
  },
  {
    key: 'declarationCount',
    label: 'Property Declarations',
    tone: 'tone-pink',
    format: (m) => String(m.declarationCount),
  },
]

export function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <section className="metrics" aria-label="Stylesheet statistics" aria-live="polite">
      {ITEMS.map((item) => (
        <div key={item.label} className={`metric ${item.tone}`}>
          <span className="metric-label">{item.label}</span>
          <span className="metric-value">{item.format(metrics)}</span>
        </div>
      ))}
    </section>
  )
}
