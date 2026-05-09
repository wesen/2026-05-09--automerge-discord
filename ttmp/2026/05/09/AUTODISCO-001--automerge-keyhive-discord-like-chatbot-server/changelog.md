# Changelog

## 2026-05-09

- Created ticket workspace `AUTODISCO-001` for the Automerge + Keyhive Discord-like chatbot server design.
- Added primary design guide and investigation diary documents.
- Captured Automerge and Keyhive source material as Markdown under `sources/web/`.
- Cloned upstream repositories under `vendor/` for file-backed implementation references.
- Added and ran `scripts/automerge-chat-model-smoke.mjs`; fixed `A.merge` usage after validating the current API returns a document directly.
- Wrote the full intern-oriented design and implementation guide with diagrams, schemas, pseudocode, APIs, implementation phases, risks, and references.
- Committed the research ticket baseline as `c1d2f4b6922689b1192737e746640566f1d6235b`.
- Built Phase 0 scaffold: root npm workspace, TypeScript base config, and package directories for `chat-core`, `chat-server`, `chat-client`, `chat-acl`, and `chat-bot-worker`.
- Built Phase 1 Automerge data model: branded IDs, workspace schemas, mutation helpers, and Vitest coverage for concurrent merge, reactions, edits, and idempotent bot runs.
- Built Phase 2 relay/app server: Express app, Automerge Repo with WebSocket server adapter and NodeFS storage, `/healthz`, `/api/bootstrap/workspaces`, `/sync` upgrade handling, and bootstrap integration test. Committed as `4994baf102c9c157a242dda7c8f55e00b85aa780`.
- Added initial Phase 3/5 scaffolding: in-memory ACL adapter and minimal bot worker response helper.
- Validated implementation with `npm run typecheck`, `npm run build`, and `npm test`.

## 2026-05-09

Completed research package: captured sources, cloned vendor repos, added Automerge smoke experiment, wrote design guide and diary.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/design-doc/01-automerge-keyhive-discord-like-chatbot-server-design-guide.md — Primary research deliverable
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/reference/01-investigation-diary.md — Chronological investigation record


## 2026-05-09

Implemented Phases 0-2 and committed as 4994baf102c9c157a242dda7c8f55e00b85aa780.

Added devctl setup with `.devctl.yaml`, repo-local NDJSON plugin, `chat-server` service plan, validation checks, and dynamic `check` / `bootstrap-workspace` commands.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-core/src/mutations.ts — Phase 1 model
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/src/app.ts — Phase 2 server


## 2026-05-09

Added devctl setup for supervised local server runs and dynamic check/bootstrap commands.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/.devctl.yaml — devctl config
- /home/manuel/code/wesen/2026-05-09--automerge-discord/devctl/autodisco-plugin.py — devctl plugin


## 2026-05-09

Added the first AUTODISCO web client package with React, Vite, Tailwind, RTK Query bootstrap support, Storybook/MSW, a Mac OS 1-inspired component system, and devctl services for Vite and Storybook. Moved the web dev server to explicit port 5174 after discovering 5173 belonged to another local app.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web — React/Vite/Storybook web package
- /home/manuel/code/wesen/2026-05-09--automerge-discord/devctl/autodisco-plugin.py — devctl launch plan now includes chat-server, web, and Storybook
- /home/manuel/code/wesen/2026-05-09--automerge-discord/.devctl.yaml — updated development profile description

## 2026-05-09

Added a real multi-peer Automerge relay integration test that starts the server, bootstraps a workspace, connects two independent Repo clients over WebSocket sync, applies separate message edits, and asserts convergence on both clients.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/test/sync.test.ts — two-peer Automerge relay sync test

## 2026-05-09

Extended relay integration coverage with a persistence/restart test: a message written through a client Automerge handle is observed by the server Repo, flushed to NodeFS storage, reloaded by a restarted relay, and synced to a fresh client.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/test/sync.test.ts — relay sync and persistence integration tests

## 2026-05-09

Wired the browser chat UI to live Automerge Repo/DocHandle state with IndexedDB storage, WebSocket sync, local identity, workspace open/join form, and live message sending. Verified two isolated browser contexts exchange messages through the relay.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/features/automerge — browser Repo, identity, and live workspace hooks
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/components/molecules/OpenWorkspaceForm — manual existing-workspace join form
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/pages/HomePage/HomePage.tsx — live workspace create/open flow

## 2026-05-09

Added Playwright E2E coverage for live browser Automerge sync: two isolated browser contexts create/open the same workspace and exchange messages through the relay.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/e2e/live-sync.spec.ts — two-context browser sync E2E test
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/playwright.config.ts — Playwright configuration

Added devctl dynamic command `test-web-sync` to run the Playwright two-session browser sync test against already-running development services.

## 2026-05-09

Added offline/reconnect Automerge integration coverage: Bob syncs initial state, disconnects with local storage, edits offline, reconnects, and converges with Alice's online edit.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-server/test/sync.test.ts — live sync, persistence, and offline/reconnect relay tests

## 2026-05-09

Added workspace sharing UX polish and a toggleable debug log pane: copy buttons for document/sync/join links, join-link query parsing, local-session reset with IndexedDB cleanup, and in-app logging for create/open/copy/send/status/reset events.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/components/molecules/WorkspaceCard/WorkspaceCard.tsx — copy/reset actions on active workspace metadata
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/components/organisms/LogPane — toggleable debug log pane
- /home/manuel/code/wesen/2026-05-09--automerge-discord/packages/chat-web/src/pages/HomePage/HomePage.tsx — join-link parsing/generation, logging, clipboard, and reset flow
