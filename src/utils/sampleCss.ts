/** Realistic sample stylesheet aligned with HiMat Free Tools demo. */
export const SAMPLE_CSS = `/* Sample CSS Stylesheet for HiMat Free Tools */
:root {
  --primary: #2563eb;
  --accent: #27d3f3;
  --bg-dark: #0f172a;
}

body,
html {
  margin: 0;
  padding: 0;
  font-family: "Poppins", sans-serif;
  background-color: var(--bg-dark);
  color: #f8fafc;
}

.card {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.8);
  padding: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
  margin-top: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background-color: var(--primary);
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #1d4ed8;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .card {
    padding: 16px;
  }
}
`
