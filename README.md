# SISTAFUND — website

The SISTAFUND site. Static (HTML/CSS/JS, no build step): pushing to `main` deploys automatically.

## Where things are

| File | Role |
|---|---|
| `data.js` | All the content that changes: companies, community (LPs), news, FAQ, team bios |
| `index.html` | The home page |
| `manifesto` · `portfolio` · `team` · `community` · `news` · `legal` · `esg` `.html` | The dedicated pages |
| `style.css` | All styling |
| `script.js` | Home-page animations |
| `reveal.js` | Inertial scroll + on-scroll reveals — loaded on every page |
| `wall.js` | The animated background |
| `img/` | Photos, logos, portraits |
| `docs/` | The regulatory PDFs linked from the ESG page |
| `fonts/` | The two brand typefaces |

## Editing

Content lives in `data.js`; drop the matching image in the right `img/` sub-folder. To run locally: `python3 serve.py`, then open http://localhost:8090.

**After changing `style.css`, `script.js`, `data.js`, `reveal.js` or `wall.js`, bump the matching `?v=` number in the HTML files** — otherwise visitors keep the old cached version.
