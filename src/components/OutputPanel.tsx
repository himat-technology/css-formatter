interface OutputPanelProps {
  title: string
  value: string
  emptyHint: string
  onCopy: () => void
  onDownload: () => void
  copied: boolean
  downloadLabel: string
  compact?: boolean
}

export function OutputPanel({
  title,
  value,
  emptyHint,
  onCopy,
  onDownload,
  copied,
  downloadLabel,
  compact = false,
}: OutputPanelProps) {
  const hasContent = value.trim().length > 0
  const headingId = title.toLowerCase().replace(/\s+/g, '-')

  return (
    <section className={`panel panel-output${compact ? ' panel-compact' : ''}`} aria-labelledby={headingId}>
      <div className="panel-header">
        <h2 id={headingId}>{title}</h2>
        <div className="panel-actions">
          <button
            type="button"
            className="btn btn-small"
            onClick={onCopy}
            disabled={!hasContent}
            aria-label={`Copy ${title}`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={onDownload}
            disabled={!hasContent}
            aria-label={downloadLabel}
          >
            Download
          </button>
        </div>
      </div>
      <pre className="output" tabIndex={0} aria-readonly="true">
        {hasContent ? value : <span className="empty-state">{emptyHint}</span>}
      </pre>
    </section>
  )
}
