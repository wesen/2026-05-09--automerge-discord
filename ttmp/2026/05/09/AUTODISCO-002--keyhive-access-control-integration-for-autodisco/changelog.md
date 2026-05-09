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

## 2026-05-09

Implemented Phase K3 mock invitations: server exposes create/revoke invitation endpoints backed by the ACL adapter, tests cover allow/deny/revoke cases, RTK Query exposes invitation mutations, and the web UI can paste a contact card and copy a generated mock invitation.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/src/http/bootstrap.ts — invitation/revoke API
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/test/bootstrap.test.ts — invitation allow/deny/revoke assertions
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/features/bootstrap/bootstrapApi.ts — invitation RTK Query mutations
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/components/molecules/InvitationForm — invite UI and stories

## 2026-05-09

Implemented Phase K4 mock app-layer checks: browser send-message now passes through a mock comment permission helper with visible denial logs, invite/revoke admin checks remain server-side, and `@autodisco/chat-acl` now has Vitest coverage for grants, missing grants, nested contact cards, invite, and revoke.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/features/access/mockPermissions.ts — mock comment permission helper
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/pages/HomePage/HomePage.tsx — visible permission-denied logging before send
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/test/access.test.ts — ACL grant/missing-grant tests

## 2026-05-09

Ran Phase K5 Keyhive WASM spike and preserved all ad-hoc scripts under the ticket `scripts/` directory. Installed `@keyhive/keyhive@next`, added a real WASM spike test for init/contact-card/group/document/delegate/revoke/archive behavior, and recorded `tryEncrypt` as currently blocked by `null pointer passed to rust`.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/test/keyhive-spike.test.ts — real Keyhive WASM working-subset test
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/scripts/01-keyhive-node-spike-full.mjs — full exploratory spike and encryption failure reproduction
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/scripts/02-keyhive-node-spike-stable.mjs — stable working Keyhive API proof
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/scripts/03-keyhive-encrypt-spike.mjs — focused encryption/decryption failure reproduction

## 2026-05-09

Implemented a limited `KeyhiveAccessControlAdapter` behind the ACL seam and added `ACL_MODE=mock|keyhive-experimental` server selection. The adapter supports real Keyhive identity/contact-card/group/document/delegation/revocation/event/archive-export behavior, but durable archive reload and content encryption remain incomplete.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/src/index.ts — experimental Keyhive adapter and adapter factory
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/test/keyhive-adapter.test.ts — experimental adapter tests
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/src/config.ts — `ACL_MODE` selection
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/src/app.ts — adapter factory wiring

## 2026-05-09

Wrote two long-form Obsidian project reports and copied them into the ticket: one covering the Automerge/backend/React web UI architecture and one covering the Keyhive access-control architecture, mock flow, WASM spike, and experimental adapter.

### Related Files

- /home/manuel/code/wesen/obsidian-vault/Projects/2026/05/09/PROJ - AUTODISCO - Automerge Discord App Architecture.md — Obsidian project report for the Automerge app architecture
- /home/manuel/code/wesen/obsidian-vault/Projects/2026/05/09/PROJ - AUTODISCO - Keyhive Access Control Architecture.md — Obsidian project report for the Keyhive architecture
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/project-reports/01-PROJ - AUTODISCO - Automerge Discord App Architecture.md — ticket-local copy
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/project-reports/02-PROJ - AUTODISCO - Keyhive Access Control Architecture.md — ticket-local copy

## 2026-05-09

Resumed AUTODISCO-002 using the locally fixed Keyhive package from repo-root `vendor/keyhive-src/keyhive_wasm/pkg-node-patched`. `@autodisco/chat-acl` now depends on the patched local package, real Keyhive encrypt/decrypt is covered in the spike test, and `KeyhiveAccessControlAdapter` has experimental document-content encrypt/decrypt helpers with passing test coverage.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/package.json — points `@keyhive/keyhive` at the fixed local package
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/src/index.ts — experimental encrypt/decrypt helpers
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/test/keyhive-spike.test.ts — real Keyhive encrypt/decrypt proof
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/test/keyhive-adapter.test.ts — adapter encrypt/decrypt proof

## 2026-05-09

Implemented durable experimental Keyhive persistence. `KeyhiveAccessControlAdapter` now exports/restores a JSON-safe snapshot containing signing-key bytes, archive bytes, prekey secret bytes, known document IDs, known agent IDs, and admin targets. The server writes this snapshot to `${DATA_DIR}/keyhive-acl-snapshot.json` when `ACL_MODE=keyhive-experimental`, and restart coverage proves a restored server can create invitations for an existing workspace document.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/src/index.ts — snapshot model, restore path, persistence callbacks, and document/agent rehydration
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-acl/test/keyhive-adapter.test.ts — adapter snapshot restore tests
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/src/app.ts — file-backed server snapshot wiring
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/src/http/bootstrap.ts — invitation response mode now follows `config.aclMode`
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/test/bootstrap.test.ts — server restart persistence test
