# Descon AP-AMC Dashboard — desktop app

This wraps the dashboard (`../Descon AP-AMC Progress & KPIs monitoring.html`) in a
standalone Windows desktop app using Electron. The HTML file stays the single
source of truth — this folder just packages it into a `.exe` you can double-click
without opening a browser.

## One-time setup

```bash
npm install
```

## Run it during development

```bash
npm run start
```

This opens the app loading the HTML file directly from the parent folder, so any
edits you make to the dashboard show up the next time you run it — no rebuild
needed.

## Build a standalone app you can share

```bash
npm run package
```

Produces `dist/Descon AP-AMC Dashboard-win32-x64/`, a self-contained folder with
`Descon AP-AMC Dashboard.exe` — copy or zip the whole folder to another Windows PC
and it runs with no installation, no Node.js, and no browser required. Re-run this
command any time the dashboard HTML changes and you want an updated standalone copy
(it always re-copies the latest HTML from the parent folder).

## Installer build (optional, currently blocked on this machine)

`npm run dist` uses `electron-builder` to produce a proper NSIS installer (Start
Menu shortcut, uninstaller, etc.) instead of a plain folder. It currently fails on
this machine because Windows blocks creating symbolic links for an unprivileged
user, which `electron-builder`'s cross-platform code-signing tools need even for
an unsigned Windows build. To use it: enable **Settings > Privacy & security >
For developers > Developer Mode**, then retry `npm run dist`.
