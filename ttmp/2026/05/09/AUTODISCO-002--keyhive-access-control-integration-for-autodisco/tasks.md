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

- [ ] Add an ACL adapter factory in `packages/chat-acl`.
- [ ] Inject `AccessControlAdapter` into server app/bootstrap dependencies.
- [ ] Extend `createWorkspaceDoc` input to accept optional `keyhive` refs.
- [ ] Call `acl.createWorkspace(name)` from `POST /api/bootstrap/workspaces`.
- [ ] Store matching `WorkspaceDoc.keyhive` refs in the Automerge workspace doc.
- [ ] Return `keyhive.workspaceGroupId` and `keyhive.workspaceDocumentId` in bootstrap response.
- [ ] Update bootstrap and sync tests.
- [ ] Display ACL refs in the web workspace card or debug panel.

### Phase K2: Identity and contact-card UI

- [ ] Add `IdentityCard` component and Storybook stories.
- [ ] Add mock contact-card JSON export/copy.
- [ ] Add debug-log entries for identity/contact-card actions.
- [ ] Add local reset coverage for access identity state.

### Phase K3: Invitation API and UI

- [ ] Add invitations router with contact-card receive, invite, and revoke endpoints.
- [ ] Add server tests for invite/revoke allow and deny cases.
- [ ] Add RTK Query invitation API client.
- [ ] Add `InviteMemberForm` component and Storybook stories.
- [ ] Wire invite actions into `HomePage` and debug log.

### Phase K4: App-layer ACL enforcement

- [ ] Check comment access before browser send-message mutation.
- [ ] Check admin access before invite/revoke operations.
- [ ] Add visible permission-denied log/UI feedback.
- [ ] Add unit/integration tests for missing-grant behavior.

### Phase K5: Keyhive WASM spike

- [ ] Decide whether to install from npm, git, or local vendored package.
- [ ] Prove `Keyhive.init` in Node or browser/Vite.
- [ ] Prove contact-card export/receive.
- [ ] Prove group/document creation.
- [ ] Prove addMember/revokeMember.
- [ ] Prove event export/ingest or archive transfer.
- [ ] Prove encrypt/decrypt for authorized peer.
- [ ] Record exact package version, build settings, failures, and API gaps in diary.

### Phase K6: Experimental Keyhive adapter

- [ ] Implement `KeyhiveAccessControlAdapter` behind the existing interface.
- [ ] Add `ACL_MODE=mock|keyhive-experimental` selection.
- [ ] Persist/load Keyhive archive state.
- [ ] Convert membership events to/from JSON-safe base64 arrays.
- [ ] Add tests gated for experimental mode.

### Phase K7: Beelay/E2EE research

- [ ] Determine whether Beelay is usable directly from TypeScript.
- [ ] Evaluate Automerge Repo `shareConfig.access` peer-identity limitations.
- [ ] Design authenticated relay handshake.
- [ ] Design encrypted document/chunk storage path.
- [ ] Design bot access and revocation behavior.
