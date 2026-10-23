# UX contract

## Business evidence

The current modernization request approves the G4T0XX black/red identity and completion of working products. Runtime policies are defined in app/library.cjs owns game/mod storage, backups, conflict detection, enable/disable and removal. The renderer cannot choose arbitrary file paths through IPC.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Form | `app/renderer.js` | Runtime policy referenced above | Localized labels, app-owned errors, preserve input after failures. | Project verification referenced below |
| Modal | `app/renderer.js` | Runtime policy referenced above | Native document dialog with modal focus, Escape and restoration. | Project verification referenced below |
| Select/Listbox | `app/renderer.js` | Runtime policy referenced above | Native OS popup accepted for PDF typography settings; not used in Vision/Modmenu. | Project verification referenced below |
| Scrollbar | `app/style.css` | Runtime policy referenced above | Global thumb, track, hover, active and forced-colors behavior. | Project verification referenced below |
| Toast | `app/renderer.js` | Runtime policy referenced above | Shared status/live region and persistent error text. | Project verification referenced below |
| CRUD | `app/renderer.js` | Runtime policy referenced above | Explicit actions, stable processing state, confirmation for discard/revoke/file writes. | Project verification referenced below |

## Flow ledger

- Submit: block duplicates while pending, show the actual result, keep inputs on failure.
- Search: local filter, explicit clear, no asynchronous race. Vision persists committed query in URL. PDF does not expose a dataset search.
- Unsaved document: guard app close and navigation. Browser lifecycle guard is reserved for real unload.
- Command dispatch is distinct from execution. Vision marks success only after an agent acknowledges it.
- Mod installation uses original-file backups. A modified destination blocks restoration rather than overwriting later user edits.
- PDF page and mark edits share one bounded undo/redo history. Coverage overlays do not securely remove original PDF text.

## Verification

Project evidence: `test/library.test.cjs`. Runtime screenshots and reports are saved under `reports/`. Status and limitations are documented in release notes; builds alone do not prove device behavior.
