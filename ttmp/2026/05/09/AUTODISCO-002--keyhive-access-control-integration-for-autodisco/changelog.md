# Changelog

## 2026-05-09

- Created AUTODISCO-002 ticket workspace for Keyhive access-control integration planning.
- Added primary design guide and investigation diary documents.
- Copied Keyhive notebook, WASM API binding source, package metadata, and upstream WASM e2e examples into the ticket for local reference.
- Inspected current AUTODISCO ACL, core schema, bootstrap, relay, browser Repo, and web home page flows.
- Wrote `sources/01-source-list.md` inventory.
- Wrote detailed intern-oriented `Keyhive Access Control Integration Design Guide` covering current state, conceptual model, API design, UI design, phases K1-K7, testing, risks, alternatives, and recommended first PR.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/design-doc/01-keyhive-access-control-integration-design-guide.md — Primary Keyhive integration design guide
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/reference/01-investigation-diary.md — Chronological investigation diary
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/sources/01-source-list.md — Evidence inventory
- Validated ticket metadata with `docmgr doctor --ticket AUTODISCO-002 --stale-after 30`.
- Uploaded the documentation bundle to reMarkable at `/ai/2026/05/09/AUTODISCO-002/AUTODISCO-002_Keyhive_Access_Control_Guide.pdf`.

## 2026-05-09

Implemented Phase K1 mock ACL metadata wiring: workspace bootstrap now creates mock access-control refs, stores them in `WorkspaceDoc.keyhive`, returns them in bootstrap JSON, and displays/copies them in the web workspace card.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/src/index.ts — ACL adapter factory
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-core/src/workspace.ts — optional Keyhive refs in workspace constructor
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/src/http/bootstrap.ts — bootstrap ACL metadata creation and response
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/test/bootstrap.test.ts — bootstrap metadata assertions
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/components/molecules/WorkspaceCard/WorkspaceCard.tsx — ACL ref display/copy UI

## 2026-05-09

Implemented Phase K2 mock identity/contact-card UI: browser identities now include a persisted mock public key/fingerprint, the app renders an identity card, and users can copy a product-shaped mock contact card with debug-log feedback.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/features/automerge/identity.ts — mock identity and contact-card helpers
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/components/molecules/IdentityCard — identity/contact-card UI and stories
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/pages/HomePage/HomePage.tsx — identity card rendering and contact-card copy logging
