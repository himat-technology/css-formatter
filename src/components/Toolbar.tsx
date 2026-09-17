import type { IndentStyle } from '../utils/cssFormatter'

interface ToolbarProps {
  indent: IndentStyle
  onIndentChange: (value: IndentStyle) => void
  stripComments: boolean
  onStripCommentsChange: (value: boolean) => void
  onUpload: () => void
  onSample: () => void
  onClear: () => void
  onAutoRepair: () => void
}

const INDENT_OPTIONS: { value: IndentStyle; label: string }[] = [
  { value: '2', label: '2 Spaces' },
  { value: '4', label: '4 Spaces' },
  { value: 'tab', label: 'Tab' },
  { value: 'single', label: 'Single-line rules' },
]

export function Toolbar({
  indent,
  onIndentChange,
  stripComments,
  onStripCommentsChange,
  onUpload,
  onSample,
  onClear,
  onAutoRepair,
}: ToolbarProps) {
  return (
    <section className="toolbar" aria-label="Formatting controls">
      <div className="toolbar-group">
        <label htmlFor="indent-select" className="toolbar-label">
          Indentation
        </label>
        <select
          id="indent-select"
          className="select"
          value={indent}
          onChange={(e) => onIndentChange(e.target.value as IndentStyle)}
        >
          {INDENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-group toolbar-toggle">
        <label className="checkbox-label" htmlFor="strip-comments">
          <input
            id="strip-comments"
            type="checkbox"
            checked={stripComments}
            onChange={(e) => onStripCommentsChange(e.target.checked)}
          />
          <span>Strip CSS Comments</span>
        </label>
      </div>

      <div className="toolbar-actions" role="group" aria-label="Editor actions">
        <button type="button" className="btn btn-secondary" onClick={onUpload}>
          Upload .css
        </button>
        <button type="button" className="btn btn-secondary" onClick={onSample}>
          Sample CSS
        </button>
        <button type="button" className="btn btn-accent" onClick={onAutoRepair}>
          Auto-Repair
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          Clear
        </button>
      </div>
    </section>
  )
}
