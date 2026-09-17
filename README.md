# CSS Formatter & Minifier

A production-quality, **100% client-side** CSS Formatter & Minifier by **[HiMat Technology](https://himat.co.in)**.

Paste or upload CSS, beautify it with configurable indentation, minify for production, strip comments, auto-repair common syntax issues, and inspect live stylesheet metrics — all without sending your code to any server.

| | |
| --- | --- |
| **Live demo** | [himat.tech/free-tools/css-formatter](https://himat.tech/free-tools/css-formatter) |
| **Website** | [himat.co.in](https://himat.co.in) |
| **Email** | [info@himat.co.in](mailto:info@himat.co.in) |
| **Phone** | [+91 94452 34023](tel:+919445234023) |

> Inspired by the [HiMat CSS Formatter & Minifier](https://himat.tech/free-tools/css-formatter). This repository is a standalone local implementation — it does **not** embed, iframe, scrape, or call the HiMat website at runtime.

---

## Connect with HiMat Technology

- **Website:** [himat.co.in](https://himat.co.in)
- **Demo tool:** [CSS Formatter & Minifier Online](https://himat.tech/free-tools/css-formatter)
- **Facebook:** [Himat Technology](https://www.facebook.com/people/Himat-technology/61593829197445/)
- **LinkedIn:** [himat-technology](https://www.linkedin.com/company/himat-technology)
- **Instagram:** [@himat_technology](https://www.instagram.com/himat_technology?igsi=djdmcGxweWtwYWI0)
- **Email:** [info@himat.co.in](mailto:info@himat.co.in)
- **Contact:** [94452 34023](tel:+919445234023)

---

## Features

- **Format / beautify** CSS with 2-space, 4-space, Tab, or single-line rules
- **Minify** CSS for production (whitespace, comments, trailing semicolons)
- **Strip CSS comments** (safe for strings and `url(...)`)
- **Auto-Repair** for missing braces, missing semicolons, and spacing cleanup
- **Upload `.css`** files via the browser File API
- **Sample CSS** with variables, media queries, hover states, and more
- **Copy** and **download** formatted (`formatted-himat.css`) or minified (`minified-himat.css`) output
- **Live metrics**: raw bytes, minified size, bandwidth saved %, selectors, declarations
- **Privacy-first**: processing happens entirely in browser memory
- Responsive layout for desktop, tablet, and mobile

## Technology

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for local development and production builds
- Custom CSS tokenizer / formatter / minifier (no backend, no database, no auth)

## How CSS processing works

1. Input CSS is **tokenized** in the browser (`src/utils/cssTokenizer.ts`), preserving strings, comments, and `url(...)` values.
2. The **formatter** rebuilds readable CSS with the selected indentation (`src/utils/cssFormatter.ts`).
3. The **minifier** removes comments and unnecessary whitespace without unsafe semantic rewrites (`src/utils/cssMinifier.ts`).
4. **Auto-Repair** applies conservative fixes only when safe (`src/utils/cssRepair.ts`).
5. **Metrics** are computed from the live input (`src/utils/cssMetrics.ts`).

No CSS content is transmitted over the network for processing.

## Privacy model

- No API endpoints for CSS processing
- No remote storage or logging of stylesheet content
- Uploaded files are read locally with `FileReader` and never uploaded
- Downloads are generated with `Blob` URLs in the browser

## Project structure

```
css-formatter/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/          # UI pieces (header, toolbar, editors, metrics, footer)
│   ├── styles/              # Application styles
│   ├── utils/
│   │   ├── cssTokenizer.ts  # Safe tokenization
│   │   ├── cssFormatter.ts  # Beautify / strip comments
│   │   ├── cssMinifier.ts   # Production minify
│   │   ├── cssRepair.ts     # Conservative auto-repair
│   │   ├── cssMetrics.ts    # Live stats
│   │   ├── fileUtils.ts     # Upload / copy / download helpers
│   │   └── sampleCss.ts     # Sample stylesheet
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Install

```bash
npm install
```

## Run locally (development)

```bash
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:5173`).

## Production build

```bash
npm run build
```

Output is written to `dist/`.

## Preview the production build

```bash
npm run preview
```

## Usage tips

1. Paste CSS, click **Sample CSS**, or **Upload .css**.
2. Choose indentation and optionally enable **Strip CSS Comments**.
3. Use **Auto-Repair** if braces or semicolons look incomplete.
4. Copy or download the formatted and minified panels.
5. Watch the metrics bar update as you edit.

## Contact & support

Built with care by **HiMat Technology**.

| Channel | Details |
| --- | --- |
| Website | [himat.co.in](https://himat.co.in) |
| Online demo | [himat.tech/free-tools/css-formatter](https://himat.tech/free-tools/css-formatter) |
| Email | [info@himat.co.in](mailto:info@himat.co.in) |
| Phone | [94452 34023](tel:+919445234023) |
| Facebook | [Himat Technology](https://www.facebook.com/people/Himat-technology/61593829197445/) |
| LinkedIn | [Company page](https://www.linkedin.com/company/himat-technology) |
| Instagram | [@himat_technology](https://www.instagram.com/himat_technology?igsi=djdmcGxweWtwYWI0) |

## License

See [LICENSE](./LICENSE).
