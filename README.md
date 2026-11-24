# The Cosmic Tribunal — Sovereignty Beyond Worlds

A playable grand-strategy governance game set in the Cosmic World. Preside over the Cosmic Tribunal, decide petitions, manage the Cosmic Treasury, pass laws, lead the Royal Cosmic Council and respond to emergencies across the Cosmos.

**Play:** open `index.html` in any modern browser, or visit the GitHub Pages site for this repository.

Campaigns save in your browser. Use Settings → Copy campaign JSON to back up.

## Development

`index.html` is generated. Edit the files in `source/src/`, then rebuild from inside `source/`:

```bash
python3 build.py
```

This writes the playable `index.html` at the repository root.

Tests (Node.js; the UI test needs Playwright):

```bash
node source/test/engine.test.js
```

UNITED UNDER THE CROWN.
