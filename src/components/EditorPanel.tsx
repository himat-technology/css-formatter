interface EditorPanelProps {
  id: string
  value: string
  onChange: (value: string) => void
  byteSize: number
}

export function EditorPanel({ id, value, onChange, byteSize }: EditorPanelProps) {
  const chars = value.length

  return (
    <section className="panel panel-input" aria-labelledby={`${id}-label`}>
      <div className="panel-header">
        <h2 id={`${id}-label`}>Input CSS</h2>
        <p className="panel-meta" aria-live="polite">
          {chars.toLocaleString()} chars · {byteSize.toLocaleString()} B
        </p>
      </div>
      <label htmlFor={id} className="visually-hidden">
        CSS source editor
      </label>
      <textarea
        id={id}
        className="editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'Paste CSS here…\n\nbody{margin:0;padding:0;color:red}\n.card{padding:20px;background:white}'}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        wrap="off"
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="panel-hint">
        {value.trim()
          ? 'Edits update formatted and minified output live.'
          : 'Empty editor — paste CSS, upload a file, or load the sample.'}
      </p>
    </section>
  )
}
