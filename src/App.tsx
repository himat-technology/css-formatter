import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { formatCss, type IndentStyle } from './utils/cssFormatter'
import { minifyCss } from './utils/cssMinifier'
import { repairCss } from './utils/cssRepair'
import { computeMetrics } from './utils/cssMetrics'
import { copyToClipboard, downloadTextFile, readCssFile } from './utils/fileUtils'
import { SAMPLE_CSS } from './utils/sampleCss'
import { Header } from './components/Header'
import { Toolbar } from './components/Toolbar'
import { EditorPanel } from './components/EditorPanel'
import { OutputPanel } from './components/OutputPanel'
import { MetricsBar } from './components/MetricsBar'
import { StatusMessage } from './components/StatusMessage'
import { PrivacyBanner } from './components/PrivacyBanner'
import { SiteFooter } from './components/SiteFooter'

type Status = { type: 'info' | 'success' | 'error'; message: string } | null

export default function App() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<IndentStyle>('2')
  const [stripComments, setStripComments] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [copiedFormatted, setCopiedFormatted] = useState(false)
  const [copiedMinified, setCopiedMinified] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const statusTimer = useRef<number | null>(null)
  const formId = useId()

  const showStatus = useCallback((next: Status, durationMs = 3500) => {
    setStatus(next)
    if (statusTimer.current) window.clearTimeout(statusTimer.current)
    if (next && next.type !== 'error') {
      statusTimer.current = window.setTimeout(() => setStatus(null), durationMs)
    }
  }, [])

  const formatted = useMemo(() => {
    try {
      return formatCss(input, { indent, stripComments })
    } catch {
      return input
    }
  }, [input, indent, stripComments])

  const minified = useMemo(() => {
    try {
      return minifyCss(input)
    } catch {
      return input.replace(/\s+/g, ' ').trim()
    }
  }, [input])

  const metrics = useMemo(() => {
    try {
      return computeMetrics(input)
    } catch {
      return {
        rawBytes: new TextEncoder().encode(input).length,
        minifiedBytes: 0,
        bandwidthSavedPercent: 0,
        selectorCount: 0,
        declarationCount: 0,
      }
    }
  }, [input])

  useEffect(() => {
    return () => {
      if (statusTimer.current) window.clearTimeout(statusTimer.current)
    }
  }, [])

  const handleClear = () => {
    setInput('')
    setStatus(null)
    setCopiedFormatted(false)
    setCopiedMinified(false)
    showStatus({ type: 'info', message: 'Editor cleared.' }, 2000)
  }

  const handleSample = () => {
    setInput(SAMPLE_CSS)
    showStatus({ type: 'success', message: 'Sample CSS loaded.' }, 2000)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await readCssFile(file)
      setInput(text)
      showStatus({
        type: 'success',
        message: `Loaded “${file.name}” (${text.length.toLocaleString()} characters).`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read file.'
      showStatus({ type: 'error', message })
    }
  }

  const handleAutoRepair = () => {
    if (!input.trim()) {
      showStatus({ type: 'info', message: 'Paste or upload CSS before running Auto-Repair.' })
      return
    }
    try {
      const { css, repairs } = repairCss(input)
      setInput(css)
      if (repairs.length === 0) {
        showStatus({ type: 'info', message: 'No safe repairs were needed.' })
      } else {
        showStatus(
          {
            type: 'success',
            message: `Auto-Repair: ${repairs.join(' · ')}`,
          },
          5000,
        )
      }
    } catch {
      showStatus({
        type: 'error',
        message: 'Auto-Repair could not process this stylesheet. Your input was left unchanged.',
      })
    }
  }

  const handleCopyFormatted = async () => {
    try {
      await copyToClipboard(formatted)
      setCopiedFormatted(true)
      window.setTimeout(() => setCopiedFormatted(false), 2000)
      showStatus({ type: 'success', message: 'Formatted CSS copied to clipboard.' }, 2000)
    } catch {
      showStatus({ type: 'error', message: 'Could not copy. Select the text and copy manually.' })
    }
  }

  const handleCopyMinified = async () => {
    try {
      await copyToClipboard(minified)
      setCopiedMinified(true)
      window.setTimeout(() => setCopiedMinified(false), 2000)
      showStatus({ type: 'success', message: 'Minified CSS copied to clipboard.' }, 2000)
    } catch {
      showStatus({ type: 'error', message: 'Could not copy. Select the text and copy manually.' })
    }
  }

  const handleDownloadFormatted = () => {
    if (!formatted.trim()) {
      showStatus({ type: 'info', message: 'Nothing to download yet.' })
      return
    }
    try {
      downloadTextFile('formatted-himat.css', formatted)
      showStatus({ type: 'success', message: 'Downloaded formatted-himat.css' }, 2000)
    } catch {
      showStatus({ type: 'error', message: 'Download failed. Please try again.' })
    }
  }

  const handleDownloadMinified = () => {
    if (!minified.trim()) {
      showStatus({ type: 'info', message: 'Nothing to download yet.' })
      return
    }
    try {
      downloadTextFile('minified-himat.css', minified)
      showStatus({ type: 'success', message: 'Downloaded minified-himat.css' }, 2000)
    } catch {
      showStatus({ type: 'error', message: 'Download failed. Please try again.' })
    }
  }

  return (
    <div className="app">
      <a className="skip-link" href={`#${formId}-input`}>
        Skip to editor
      </a>

      <Header />
      <PrivacyBanner />

      <main className="main">
        <MetricsBar metrics={metrics} />

        <Toolbar
          indent={indent}
          onIndentChange={setIndent}
          stripComments={stripComments}
          onStripCommentsChange={setStripComments}
          onUpload={handleUploadClick}
          onSample={handleSample}
          onClear={handleClear}
          onAutoRepair={handleAutoRepair}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".css,text/css"
          className="visually-hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleFileChange}
        />

        <StatusMessage status={status} />

        <div className="workspace">
          <EditorPanel
            id={`${formId}-input`}
            value={input}
            onChange={setInput}
            byteSize={metrics.rawBytes}
          />

          <div className="output-stack">
            <OutputPanel
              title="Formatted CSS"
              value={formatted}
              emptyHint="Formatted output appears here as you type."
              onCopy={handleCopyFormatted}
              onDownload={handleDownloadFormatted}
              copied={copiedFormatted}
              downloadLabel="Download formatted-himat.css"
            />
            <OutputPanel
              title="Minified CSS"
              value={minified}
              emptyHint="Minified output appears here as you type."
              onCopy={handleCopyMinified}
              onDownload={handleDownloadMinified}
              copied={copiedMinified}
              downloadLabel="Download minified-himat.css"
              compact
            />
          </div>
        </div>

        <p className="pro-tip" role="note">
          <strong>Pro tip:</strong> Use minified CSS in production to reduce network payload and
          improve Core Web Vitals. Formatting options and the Strip Comments toggle only affect the
          formatted output — minification always removes comments and unnecessary whitespace.
        </p>
      </main>

      <footer className="footer-slot">
        <SiteFooter />
      </footer>
    </div>
  )
}
