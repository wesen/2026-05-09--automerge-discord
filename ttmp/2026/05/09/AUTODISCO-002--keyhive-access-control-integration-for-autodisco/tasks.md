# Tasks

## Completed

- [x] Create AUTODISCO-002 docmgr ticket workspace.
- [x] Add primary Keyhive integration design guide document.
- [x] Add investigation diary document.
- [x] Copy/capture Keyhive notebook and WASM API evidence into the ticket.
- [x] Inspect current AUTODISCO access-control, bootstrap, relay, web, and schema files.
- [x] Write source inventory under `sources/source-list.md`.
- [x] Write detailed intern-oriented Keyhive access-control integration guide.

## Recommended implementation backlog

### Phase K1: Mock ACL metadata in bootstrap

- [x] Add an ACL adapter factory in `packages/chat-acl`.
- [x] Inject `AccessControlAdapter` into server app/bootstrap dependencies.
- [x] Extend `createWorkspaceDoc` input to accept optional `keyhive` refs.
- [x] Call `acl.createWorkspace(name)` from `POST /api/bootstrap/workspaces`.
- [x] Store matching `WorkspaceDoc.keyhive` refs in the Automerge workspace doc.
- [x] Return `keyhive.workspaceGroupId` and `keyhive.workspaceDocumentId` in bootstrap response.
- [x] Update bootstrap and sync tests.
- [x] Display ACL refs in the web workspace card or debug panel.

### Phase K2: Identity and contact-card UI

- [x] Add `IdentityCard` component and Storybook stories.
- [x] Add mock contact-card JSON export/copy.
- [x] Add debug-log entries for identity/contact-card actions.
- [x] Add local reset coverage for access identity state.

### Phase K3: Invitation API and UI

- [x] Add invitations router with contact-card receive, invite, and revoke endpoints.
- [x] Add server tests for invite/revoke allow and deny cases.
- [x] Add RTK Query invitation API client.
- [x] Add `InvitationForm` component and Storybook stories.
- [x] Wire invite actions into `HomePage` and debug log.

### Phase K4: App-layer ACL enforcement

- [x] Check comment access before browser send-message mutation.
- [x] Check admin access before invite/revoke operations.
- [x] Add visible permission-denied log/UI feedback.
- [x] Add unit/integration tests for missing-grant behavior.

### Phase K5: Keyhive WASM spike

- [x] Decide whether to install from npm, git, or local vendored package.
- [x] Prove `Keyhive.init` in Node or browser/Vite.
- [x] Prove contact-card export/receive.
- [x] Prove group/document creation.
- [x] Prove addMember/revokeMember.
- [x] Prove event export and archive serialization.
- [x] Prove encrypt/decrypt for authorized peer using the locally fixed Keyhive WASM package from repo-root `vendor/keyhive-src/keyhive_wasm/pkg-node-patched`.
- [x] Record exact package version, build settings, failures, and API gaps in diary.

### Phase K6: Experimental Keyhive adapter

- [x] Implement `KeyhiveAccessControlAdapter` behind the existing interface.
- [x] Add `ACL_MODE=mock|keyhive-experimental` selection.
- [x] Persist/load Keyhive archive state, memory signing key bytes, prekey secret bytes, known document IDs, known agent IDs, and admin target IDs through a JSON snapshot.
- [x] Convert membership events to/from JSON-safe base64 arrays.
- [x] Add tests gated for experimental mode.
- [x] Add experimental adapter encrypt/decrypt helper coverage using the fixed package.
- [x] Add server restart coverage for `ACL_MODE=keyhive-experimental` using `${DATA_DIR}/keyhive-acl-snapshot.json`.
- [x] Add a dedicated `keyhive` devctl profile using `ACL_MODE=keyhive-experimental` and `.devctl/data/autodisco-keyhive`.

### Phase K7: Beelay/E2EE research

- [ ] Determine whether Beelay is usable directly from TypeScript.
- [ ] Evaluate Automerge Repo `shareConfig.access` peer-identity limitations.
- [ ] Design authenticated relay handshake.
- [ ] Design encrypted document/chunk storage path.
- [ ] Design bot access and revocation behavior.
