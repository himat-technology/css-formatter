const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/people/Himat-technology/61593829197445/',
    short: 'Fb',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/himat-technology',
    short: 'In',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/himat_technology?igsi=djdmcGxweWtwYWI0',
    short: 'Ig',
  },
] as const

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-card">
        <div className="footer-brand">
          <span className="brand-mark brand-mark-sm" aria-hidden="true">
            HT
          </span>
          <div>
            <strong>HiMat Technology</strong>
            <p>
              Democratizing world-class tech through AI-augmented delivery. CSS is processed 100% in
              your browser — nothing leaves your device.
            </p>
          </div>
        </div>

        <div className="footer-grid">
          <div>
            <h3>Contact</h3>
            <ul className="footer-list">
              <li>
                <a href="https://himat.co.in" target="_blank" rel="noopener noreferrer">
                  himat.co.in
                </a>
              </li>
              <li>
                <a href="mailto:info@himat.co.in">info@himat.co.in</a>
              </li>
              <li>
                <a href="tel:+919445234023">94452 34023</a>
              </li>
              <li>
                <a
                  href="https://himat.tech/free-tools/css-formatter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Online demo
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3>Social</h3>
            <ul className="footer-social" aria-label="Social links">
              {SOCIALS.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                    <span className="social-badge" aria-hidden="true">
                      {item.short}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="footer-copy">
        © {new Date().getFullYear()} HiMat Technology. CSS Formatter &amp; Minifier — client-side
        only.
      </p>
    </footer>
  )
}
