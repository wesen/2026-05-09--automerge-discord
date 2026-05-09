# Tasks

## Completed research tasks

- [x] Create docmgr ticket workspace for AUTODISCO-001.
- [x] Add primary design guide and investigation diary documents.
- [x] Gather Automerge and Keyhive web sources as local Markdown files under `sources/web/`.
- [x] Clone Automerge Repo, Automerge Repo Sync Server, and Keyhive repositories under `vendor/`.
- [x] Write a runnable Automerge chat-model smoke experiment under `scripts/`.
- [x] Run the smoke experiment and record the API correction in the diary.
- [x] Write the intern-oriented design and implementation guide.
- [x] Upload the documentation bundle to reMarkable.

## Implementation phases

### Phase 0: Repository scaffold and documentation

- [x] Create root npm workspace and TypeScript base config.
- [x] Add package directories for `chat-core`, `chat-server`, `chat-client`, `chat-acl`, and `chat-bot-worker`.
- [x] Add shared build, typecheck, test, and server dev scripts.
- [x] Add `.gitignore` entries for Node/build artifacts.
- [x] Keep implementation diary and changelog current.

### Phase 1: Automerge data model

- [x] Define branded IDs and chat/workspace TypeScript schemas.
- [x] Implement workspace and channel-message document constructors.
- [x] Implement core mutation helpers for members, roles, channels, messages, reactions, and bot runs.
- [x] Promote the smoke experiment into Vitest coverage for concurrent Automerge merges.
- [x] Add idempotent bot-run ID behavior for worker restart safety.
- [x] Validate with `npm test`.

### Phase 2: Relay/app server

- [x] Implement Express application shell with `/healthz`.
- [x] Configure an Automerge `Repo` with WebSocket server adapter and Node filesystem storage.
- [x] Mount WebSocket upgrade handling at `/sync`.
- [x] Add `POST /api/bootstrap/workspaces` to create workspace documents and return doc/sync metadata.
- [x] Add placeholder invitation endpoint documenting that real Keyhive invitations are Phase 4.
- [x] Add server integration test for workspace bootstrap.
- [x] Validate with `npm run typecheck`, `npm run build`, and `npm test`.
- [x] Add devctl setup for supervised local server runs.
- [x] Validate devctl plugin discovery, planning, `up/status/bootstrap-workspace/down`, and `check` command.

### Phase 3: Mock ACL adapter

- [x] Implement initial `AccessControlAdapter` interface and in-memory mock adapter in `chat-acl`.
- [ ] Wire mock ACL checks into chat-client mutation wrappers.
- [ ] Wire mock ACL identity into relay sharing/admission decisions.

### Phase 3.5: Web client and component system

- [x] Scaffold `packages/chat-web` with React, Vite, TypeScript, Tailwind, RTK Query, and Storybook.
- [x] Add Mac OS 1-inspired global styling contract with `data-widget="autodisco"` and `data-part` hooks.
- [x] Build atom, molecule, organism, and page component folders with matching Storybook stories.
- [x] Wire MSW into Storybook for bootstrap endpoint stories.
- [x] Add Vite web and Storybook services to the devctl development launch plan.
- [x] Move the AUTODISCO web service to explicit port `5174` with strict port checking to avoid the user's existing app on `5173`.
- [x] Validate with typecheck, build, tests, Storybook build, devctl plan/up/check, and Playwright smoke review.
- [x] Add a two-peer Automerge Repo integration test through the relay.
- [x] Add a persistence/restart sync test using the server storage adapter.
- [ ] Add an offline/reconnect convergence test with client-side storage.
- [x] Add browser Automerge Repo/DocHandle wiring so the web UI uses live distributed state instead of fixtures.
- [x] Manually verify two isolated browser contexts sync live messages through the relay.
- [ ] Promote manual two-context Playwright browser sync smoke into an automated test.

### Phase 4: Keyhive integration spike

- [ ] Spike `keyhive_wasm` in the intended runtime.
- [ ] Verify contact-card exchange.
- [ ] Verify add-member and revoke-member flows.
- [ ] Verify encrypt/decrypt round trip.
- [ ] Verify event export and ingest flows.
- [ ] Validate whether `automerge-repo` `sharePolicy` has enough peer identity context for Keyhive-aware sharing.

### Phase 5: Bot worker

- [x] Scaffold `chat-bot-worker` and add a minimal idempotent response helper.
- [ ] Connect bot worker to an Automerge repo and channel watcher.
- [ ] Add LLM/tool-call abstraction and tests for duplicate prevention.

### Phase 6: E2EE/Beelay-compatible sync path

- [ ] Design and prototype signed envelope authentication.
- [ ] Prototype membership graph sync.
- [ ] Prototype document collection sync.
- [ ] Prototype encrypted document content sync.
