---
Title: Source List
Ticket: AUTODISCO-002
Status: active
Topics:
    - keyhive
    - access-control
    - automerge
    - local-first
    - invitation
    - e2ee
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources:
    - https://www.inkandswitch.com/keyhive/notebook/
    - https://github.com/inkandswitch/keyhive
Summary: Source inventory for AUTODISCO-002 Keyhive integration planning.
LastUpdated: 2026-05-09T14:25:00-04:00
WhatFor: Use to find the local and upstream sources cited by the Keyhive integration design guide.
WhenToUse: When reviewing evidence or continuing implementation for AUTODISCO-002.
---

# Source List

This ticket reuses and narrows evidence gathered in AUTODISCO-001, plus current repository files from the AUTODISCO prototype.

## Local project files

- `packages/chat-acl/src/index.ts` — current access-control adapter seam and in-memory adapter.
- `packages/chat-core/src/types.ts` — current `WorkspaceDoc` and optional `KeyhiveRefs` schema hook.
- `packages/chat-server/src/http/bootstrap.ts` — current bootstrap endpoint and placeholder invitation endpoint.
- `packages/chat-server/src/repo.ts` — current Automerge Repo relay runtime and `sharePolicy` posture.
- `packages/chat-web/src/pages/HomePage/HomePage.tsx` — current live Automerge browser UI, join links, local identity, debug log, and workspace-opening flow.
- `packages/chat-web/src/features/automerge/repo.ts` — current browser Repo, sync URL, peer id, and IndexedDB storage setup.
- `packages/chat-web/src/features/bootstrap/bootstrapApi.ts` — current bootstrap response shape already containing optional `keyhive` fields.

## Captured Keyhive/Beelay material

- `sources/web/keyhive-notebook.md` — Ink & Switch Keyhive notebook captured as Markdown.
- `vendor-notes/keyhive_wasm_js_api.rs` — copied Keyhive WASM Rust binding surface used for API references.
- `vendor-notes/keyhive_wasm-package.json` — copied `@keyhive/keyhive` package metadata and export/build details.
- `vendor-notes/keyhive_wasm-e2e-keyhive.spec.ts` — copied upstream Keyhive WASM Playwright tests showing practical JS API usage.
- `vendor-notes/keyhive_wasm-e2e-document.spec.ts` — copied upstream document creation tests.

## Upstream URLs

- https://www.inkandswitch.com/keyhive/notebook/
- https://github.com/inkandswitch/keyhive
