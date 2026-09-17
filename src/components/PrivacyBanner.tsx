export function PrivacyBanner() {
  return (
    <aside className="privacy-banner" aria-label="Privacy guarantee">
      <span className="privacy-badge" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1.5l5 2.2v3.6c0 3.1-2.1 5.9-5 6.7-2.9-.8-5-3.6-5-6.7V3.7L8 1.5z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 8l1.7 1.7L10.5 6.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div>
        <strong>100% Client-Side Privacy Guarantee</strong>
        <p>
          Your CSS stylesheet is processed purely in browser memory — zero server network calls.
          Built by{' '}
          <a href="https://himat.co.in" target="_blank" rel="noopener noreferrer">
            HiMat Technology
          </a>
          .
        </p>
      </div>
    </aside>
  )
}
