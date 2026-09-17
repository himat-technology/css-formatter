export function Header() {
  return (
    <header className="header">
      <div className="header-glow" aria-hidden="true" />
      <div className="header-inner">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            HT
          </span>
          <div>
            <p className="eyebrow">HiMat Technology · Free developer tool</p>
            <h1>
              <span className="title-gradient">CSS Formatter</span> &amp; Minifier
            </h1>
          </div>
        </div>
        <p className="lede">
          Format, beautify, minify, strip comments, and auto-repair CSS — entirely in your browser.
          Paste a stylesheet, upload a <code>.css</code> file, or load the sample to get started.
        </p>
        <div className="header-links">
          <a
            className="chip-link chip-demo"
            href="https://himat.tech/free-tools/css-formatter"
            target="_blank"
            rel="noopener noreferrer"
          >
            Live demo
          </a>
          <a
            className="chip-link"
            href="https://himat.co.in"
            target="_blank"
            rel="noopener noreferrer"
          >
            himat.co.in
          </a>
          <a className="chip-link" href="mailto:info@himat.co.in">
            info@himat.co.in
          </a>
        </div>
      </div>
    </header>
  )
}
