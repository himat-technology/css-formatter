interface StatusMessageProps {
  status: { type: 'info' | 'success' | 'error'; message: string } | null
}

export function StatusMessage({ status }: StatusMessageProps) {
  if (!status) return null

  return (
    <div
      className={`status status-${status.type}`}
      role={status.type === 'error' ? 'alert' : 'status'}
      aria-live={status.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="status-label">
        {status.type === 'error' ? 'Error' : status.type === 'success' ? 'Done' : 'Notice'}
      </span>
      <span>{status.message}</span>
    </div>
  )
}
