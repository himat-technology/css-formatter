export class FileReadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileReadError'
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

/**
 * Read a local .css file via the File API. Never uploads to a server.
 */
export function readCssFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new FileReadError('No file selected.'))
      return
    }

    const name = file.name.toLowerCase()
    if (!name.endsWith('.css')) {
      reject(new FileReadError('Please select a file with a .css extension.'))
      return
    }

    if (file.size === 0) {
      reject(new FileReadError('The selected file is empty.'))
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      reject(
        new FileReadError(
          `File is too large (${formatSize(file.size)}). Maximum supported size is ${formatSize(MAX_FILE_SIZE)}.`,
        ),
      )
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new FileReadError('Could not read the file as text.'))
        return
      }
      resolve(result)
    }

    reader.onerror = () => {
      reject(new FileReadError('Failed to read the file. Please try again.'))
    }

    reader.readAsText(file)
  })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Download text content as a local file via a Blob URL.
 */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/css;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Copy text to the clipboard with a textarea fallback.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    throw new Error('Nothing to copy.')
  }

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!ok) throw new Error('Clipboard copy failed.')
}
