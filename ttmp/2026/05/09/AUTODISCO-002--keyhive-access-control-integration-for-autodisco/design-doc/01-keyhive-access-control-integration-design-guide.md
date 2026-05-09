---
Title: Keyhive Access Control Integration Design Guide
Ticket: AUTODISCO-002
Status: active
Topics:
    - keyhive
    - access-control
    - automerge
    - local-first
    - invitation
    - e2ee
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/chat-acl/src/index.ts
      Note: |-
        Current access-control adapter seam and in-memory mock implementation.
        Current ACL adapter seam and mock implementation
    - Path: packages/chat-core/src/types.ts
      Note: |-
        WorkspaceDoc already includes optional KeyhiveRefs fields.
        WorkspaceDoc KeyhiveRefs schema hook
    - Path: packages/chat-server/src/http/bootstrap.ts
      Note: |-
        Current workspace bootstrap endpoint and placeholder invitation endpoint.
        Workspace bootstrap and invitation placeholder
    - Path: packages/chat-server/src/repo.ts
      Note: |-
        Current Automerge Repo relay and sharePolicy behavior.
        Current Automerge relay sharePolicy
    - Path: packages/chat-web/src/features/automerge/repo.ts
      Note: |-
        Browser Repo, IndexedDB, WebSocket sync URL, and peer id setup.
        Browser Repo and IndexedDB storage setup
    - Path: packages/chat-web/src/features/bootstrap/bootstrapApi.ts
      Note: Bootstrap response already reserves optional keyhive metadata.
    - Path: packages/chat-web/src/pages/HomePage/HomePage.tsx
      Note: |-
        Current live Automerge browser flow, join URL, local identity, and debug log.
        Current browser create/open/log flow
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/sources/01-source-list.md
      Note: Source inventory for this Keyhive integration ticket.
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/sources/web/keyhive-notebook.md
      Note: Captured Ink & Switch Keyhive/Beelay notes used as conceptual source.
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/vendor-notes/keyhive_wasm-package.json
      Note: Keyhive WASM package metadata, exports, and build scripts.
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/vendor-notes/keyhive_wasm_js_api.rs
      Note: Copied Keyhive WASM API binding surface used for implementation planning.
ExternalSources:
    - https://www.inkandswitch.com/keyhive/notebook/
    - https://github.com/inkandswitch/keyhive
Summary: Detailed intern-oriented design for integrating Keyhive-style identity, invitation, access control, and eventual encrypted sync into AUTODISCO.
LastUpdated: 2026-05-09T14:20:00-04:00
WhatFor: Use this as the implementation guide for adding Keyhive-backed access-control concepts to the AUTODISCO Automerge chat prototype.
WhenToUse: Read before implementing ACL metadata, identity/contact-card UI, invitation APIs, Keyhive WASM spikes, or Beelay/E2EE transport changes.
---







# Keyhive Access Control Integration Design Guide

## Executive Summary

AUTODISCO already has a working local-first collaboration substrate: the server creates real Automerge documents, browsers open those documents through `automerge-repo`, messages are written with `DocHandle.change`, and tests prove live sync, persistence across relay restart, offline edits, reconnect, and two-browser-session sync. What it does not yet have is real access control. Anyone who learns an `automerge:...` URL and sync URL can currently open the workspace and submit Automerge changes through the relay.

Keyhive is the intended access-control layer. It is not a normal role table and it is not just a field inside an Automerge document. Keyhive models cryptographic identity, groups, documents, delegation, revocation, key agreement, encrypted content, contact-card exchange, and syncable membership events. The Ink & Switch Keyhive notebook describes a system where the membership graph tells peers and sync servers which documents a principal should be able to pull, read, or edit. The same notebook warns that the opened code is a pre-alpha preview and not production-audited (`sources/web/keyhive-notebook.md:400-410`). Therefore, the next AUTODISCO work should be a carefully staged integration: product-shaped ACL and invitation flows first, real Keyhive WASM experiments second, and encrypted Beelay-style sync later.

The recommended implementation has four layers:

1. **Access-control domain model.** Keep the existing `AccessControlAdapter` seam and make it real in product flows. AUTODISCO already defines `ChatAccess`, `AgentRef`, `MemberedRef`, `WorkspaceAccessBundle`, `ChannelAccessBundle`, and `AccessControlAdapter` in `packages/chat-acl/src/index.ts:1-36`.
2. **Mock-backed product flow.** Wire the in-memory adapter into bootstrap and invitation endpoints, store Keyhive-like references in `WorkspaceDoc.keyhive`, add identity/contact-card UI, and enforce permissions at application mutation boundaries. This teaches the app what access control means before relying on pre-alpha crypto.
3. **Keyhive WASM spike.** Build a small, isolated experiment that loads `@keyhive/keyhive`, creates two identities, exchanges contact cards, creates a group/document, adds and revokes a member, exports/ingests events, and encrypts/decrypts bytes.
4. **Experimental Keyhive adapter.** Implement `KeyhiveAccessControlAdapter` behind the same interface as the mock adapter only after the spike proves the API works in Node and browser/Vite.

The first concrete deliverable should be: **wire ACL metadata into workspace bootstrap**. When a workspace is created, the server should ask the ACL adapter for a workspace group/document bundle, store those IDs in the Automerge workspace document, and return them in the bootstrap response. That is small, testable, and unlocks all later UI and invite work.

## Problem Statement and Scope

### The problem

AUTODISCO is currently collaborative but not access-controlled. The live system has these properties:

- The relay creates and stores Automerge documents.
- The browser opens a workspace document using a raw `automerge:...` URL and WebSocket sync URL.
- The web UI can copy a join link with `doc` and `sync` query parameters.
- The debug log helps understand open/copy/send/reset events.
- Multi-session tests prove two peers can exchange messages through Automerge sync.

This is excellent for local-first behavior, but it is not enough for a Discord-like product where workspaces, channels, private channels, bots, invitations, and removals all require authorization. The current URL-sharing model is closer to a capability URL demo: knowing the URL is sufficient to participate.

### Desired outcome

We want a system where:

- each browser/device has a durable identity;
- users can exchange contact cards;
- an admin can invite another identity into a workspace or channel;
- the app can distinguish workspace membership, channel membership, read/comment/edit/admin privileges, bot access, and revocation;
- the server and clients can sync membership events;
- future encrypted sync can prevent unauthorized peers from pulling or decrypting document bytes;
- the implementation remains understandable to an intern and safe to evolve while Keyhive APIs are pre-alpha.

### In scope for this ticket

This ticket should guide and eventually track the following implementation work:

- ACL metadata wiring in workspace bootstrap.
- Invitation/contact-card API design.
- Local identity and contact-card UI design.
- Mock ACL enforcement at application boundaries.
- Keyhive WASM spike design and validation plan.
- `KeyhiveAccessControlAdapter` design.
- Testing strategy for mock mode and experimental Keyhive mode.
- Documentation of risks, limitations, and open questions.

### Out of scope for the first Keyhive implementation pass

- Production security claims. Keyhive is explicitly pre-alpha and unaudited (`sources/web/keyhive-notebook.md:400-410`).
- Replacing the current Automerge Repo sync relay with Beelay immediately.
- Full end-to-end encryption for every Automerge change.
- A complete private-channel UX and moderation model.
- A custom Beelay/RIBLT implementation in this repo.

## Current-State Architecture and Evidence

### AUTODISCO access-control seam

The project already has a package for access control. `packages/chat-acl/src/index.ts` defines five application access levels: `pull`, `read`, `comment`, `edit`, and `admin` (`packages/chat-acl/src/index.ts:1`). It defines principal references (`AgentRef`) and target references (`MemberedRef`) (`packages/chat-acl/src/index.ts:3-11`). It defines workspace/channel bundles that look like Keyhive reference data (`packages/chat-acl/src/index.ts:13-21`). Most importantly, it defines `AccessControlAdapter` with the operations we need: local identity, workspace/channel creation, contact-card receive, invite, revoke, read/comment/admin checks, and membership event export/ingest (`packages/chat-acl/src/index.ts:23-36`).

The in-memory implementation is intentionally simple. It stores grants in a map and grants the local creator `admin` when `createWorkspace` is called (`packages/chat-acl/src/index.ts:45-69`). It can create channel bundles and grant admin on the channel/document (`packages/chat-acl/src/index.ts:72-80`). Its `invite` function currently grants access to a resource/agent compound key (`packages/chat-acl/src/index.ts:87-89`), and its membership event export/ingest functions return empty arrays (`packages/chat-acl/src/index.ts:107-112`).

This means we do not need to invent an adapter seam. We need to make existing app flows use it.

### Workspace documents already have a Keyhive metadata slot

`WorkspaceDoc` already contains an optional `keyhive?: KeyhiveRefs` field (`packages/chat-core/src/types.ts:95-108`). `KeyhiveRefs` includes:

```ts
export interface KeyhiveRefs {
  workspaceGroupId: string
  workspaceDocumentId: string
  channelDocumentIds: Record<string, string>
}
```

This is exactly where the bootstrap flow should store Keyhive-like references. The doc should not store private keys or raw secret material. It should store public/copyable identifiers that the UI and invite flow can reference.

### Bootstrap does not yet create ACL metadata

The server bootstrap route currently parses the workspace name, creates a workspace id, creates an Automerge document, and returns `workspaceId`, `workspaceDocUrl`, and `syncUrl` (`packages/chat-server/src/http/bootstrap.ts:10-30`). It does not call `chat-acl` and does not populate `WorkspaceDoc.keyhive`. The `/api/bootstrap/invitations/accept` endpoint is a placeholder returning HTTP 501 with the message “Keyhive invitation acceptance is reserved for Phase 4” (`packages/chat-server/src/http/bootstrap.ts:33-36`).

This is the smallest productive gap to close first.

### The relay is document-url based, not Keyhive-aware

`packages/chat-server/src/repo.ts` creates a real Automerge Repo with a WebSocket server adapter and Node filesystem storage (`packages/chat-server/src/repo.ts:14-20`). It sets `sharePolicy: async () => false` (`packages/chat-server/src/repo.ts:21`). In Automerge Repo terms this means the relay does not announce all documents to peers, but peers that already know a document id can still request/sync through the current access path. That has been sufficient for local-first tests and join-link UX, but it is not an authorization system.

Long term, a Keyhive-aware relay should understand authenticated peers and document access. Short term, do not retrofit cryptographic guarantees into `sharePolicy`. Build product-shaped ACL first, then evaluate whether Automerge Repo `shareConfig.access` plus authenticated peer metadata is enough or whether Beelay is required.

### Browser state is local-first but not Keyhive-backed

The current web app creates a local identity with `getLocalIdentity`, opens Automerge documents, copies join links, sends messages via Automerge, and logs events (`packages/chat-web/src/pages/HomePage/HomePage.tsx:31-131`). It parses `doc`/`workspace` and `sync` query parameters into an active workspace (`packages/chat-web/src/pages/HomePage/HomePage.tsx:137-150`). It uses `localStorage` and `sessionStorage` for browser identity/peer information, and the browser Repo uses IndexedDB (`packages/chat-web/src/features/automerge/repo.ts:7-17`, `:19-35`).

This is a useful UI foundation for Keyhive work: the app already has places to show local identity, join metadata, logs, and reset tools. The missing part is that `getLocalIdentity` is an app-local mock identity, not a Keyhive individual/contact card.

### Keyhive/Beelay concepts from the notebook

The captured Keyhive notebook gives several design constraints:

- Groups model devices, teams, and similar abstractions. Following delegations between groups reveals which public keys have what access to a document (`sources/web/keyhive-notebook.md:126-133`).
- Keyhive wants encrypted-at-rest data and causal key management for Automerge content (`sources/web/keyhive-notebook.md:134-144`).
- “Pull” access is weaker than read/write; it allows retrieving ciphertext bytes from the network but not decrypting or modifying them (`sources/web/keyhive-notebook.md:146-148`).
- Beelay is designed to authenticate peers, sync the membership graph first, then sync document collections, then individual documents (`sources/web/keyhive-notebook.md:414-428`).
- Beelay messages are signed envelopes containing payload, audience, timestamp, signature, and sender public key (`sources/web/keyhive-notebook.md:502-520`).
- Membership sync is a set reconciliation problem over membership operations (`sources/web/keyhive-notebook.md:522-568`).
- Document collection sync compares document ids, heads, and CGKA operation state (`sources/web/keyhive-notebook.md:574-588`).

The key engineering implication: Keyhive is not just “check this permission before sending a message.” It is also a membership graph and cryptographic distribution mechanism. But AUTODISCO can build toward that gradually.

### Keyhive WASM API evidence

The copied Keyhive WASM Rust bindings show a usable JavaScript-facing API surface:

- `Keyhive.init(signer, ciphertextStore, eventHandler)` creates a local Keyhive (`vendor-notes/keyhive_wasm_js_api.rs:65-82`).
- `id`, `whoami`, `individual`, and `idString` expose identity (`vendor-notes/keyhive_wasm_js_api.rs:84-115`).
- `generateGroup` creates groups (`vendor-notes/keyhive_wasm_js_api.rs:117-134`).
- `generateDocument` creates document principals using content refs (`vendor-notes/keyhive_wasm_js_api.rs:136-166`).
- `tryEncrypt` and `tryDecrypt` cover encrypted content (`vendor-notes/keyhive_wasm_js_api.rs:174-190`, `:220-227`).
- `addMember` and `revokeMember` expose delegation/revocation (`vendor-notes/keyhive_wasm_js_api.rs:230-272`).
- `contactCard` and `receiveContactCard` support introductions (`vendor-notes/keyhive_wasm_js_api.rs:316-349`).
- `eventsForAgent` exports serialized membership/prekey/CGKA events for an agent (`vendor-notes/keyhive_wasm_js_api.rs:377-426`).
- `getGroup`, `getDocument`, and `docMemberCapabilities` expose loaded state and membership capabilities (`vendor-notes/keyhive_wasm_js_api.rs:598-635`).

The package metadata says the package name is `@keyhive/keyhive`, currently `0.0.0-alpha.56`, and it exports node, bundler, slim, wasm, and base64 variants (`vendor-notes/keyhive_wasm-package.json:1-45`). The upstream browser tests instantiate `Keyhive`, `Signer`, and `CiphertextStore`, create groups/documents, parse contact cards, add/revoke members, serialize archives, and ingest archives (`vendor-notes/keyhive_wasm-e2e-keyhive.spec.ts:21-36`, `:72-110`, `:112-168`, `:195-300`; `vendor-notes/keyhive_wasm-e2e-document.spec.ts:9-31`).

## Conceptual Model for a New Intern

### Automerge vs Keyhive

Automerge answers: “What is the shared application state, and how do concurrent edits merge?”

Keyhive answers: “Who is allowed to access which documents, how do we delegate/revoke access, and how do we encrypt/sync access-control history?”

Do not confuse these layers. A user may appear in `WorkspaceDoc.members`, but that is UI/application state. Real access should eventually come from Keyhive membership. In early mock mode, those may be kept in sync by convention. In real mode, Keyhive should be source-of-truth for authorization.

### Principal types

Use these mental mappings:

| AUTODISCO concept | Keyhive-like concept | Implementation note |
| --- | --- | --- |
| Browser tab/device | Individual | Device identity controls a signing key. |
| Person/account | Group | Eventually group devices into one account/person. |
| Workspace | Group + document | Workspace group controls root workspace document. |
| Role | Group | Role group can be delegated to documents/channels. |
| Channel | Document or group+document | Private channels need independent membership. |
| Bot worker | Individual or group | Bot should be invited like any other agent. |
| Invite | Contact-card exchange + addMember | Contact card introduces identity; addMember grants access. |
| Kick/revoke | revokeMember | Revocation affects future access and key updates. |

### Access levels

AUTODISCO currently defines:

```ts
type ChatAccess = 'pull' | 'read' | 'comment' | 'edit' | 'admin'
```

Keyhive WASM currently accepts strings `relay`, `read`, `edit`, and `admin` (`vendor-notes/keyhive_wasm_js_api.rs` copied from `src/js/access.rs`; original access lines show `tryFromString` mapping relay/read/edit/admin). The mapping should be explicit:

| AUTODISCO `ChatAccess` | Keyhive `Access` | Meaning |
| --- | --- | --- |
| `pull` | `relay` | May fetch ciphertext / relay bytes; cannot decrypt or modify. |
| `read` | `read` | May decrypt/read content. |
| `comment` | `edit` | May append ordinary messages/reactions. AUTODISCO refines edit at app layer. |
| `edit` | `edit` | May modify channel/workspace records. |
| `admin` | `admin` | May delegate/revoke/manage. |

The important mismatch is `comment`. Keyhive has broad edit semantics; AUTODISCO wants “can post normal chat content” separate from “can edit channel settings.” The app should enforce that distinction above Keyhive.

## Proposed Architecture

### High-level phases

```text
Phase K1: Mock ACL metadata in bootstrap
  -> workspace gets keyhive-like IDs
  -> bootstrap response returns keyhive refs
  -> no real crypto yet

Phase K2: Identity and contact-card UX
  -> local identity panel
  -> copy contact card
  -> paste/receive contact card
  -> all mock-compatible

Phase K3: Invitation APIs and UI
  -> admin invites agent to workspace/channel
  -> access level selected
  -> membership events returned/stored

Phase K4: App-layer ACL enforcement
  -> send message checks comment access
  -> invite/revoke checks admin access
  -> logs show allow/deny

Phase K5: Keyhive WASM spike
  -> isolated package/test
  -> prove identity, contact card, group/doc, add/revoke, event export/ingest, encrypt/decrypt

Phase K6: Experimental KeyhiveAccessControlAdapter
  -> same interface as mock adapter
  -> mode switch mock/keyhive

Phase K7: Encrypted document sync research
  -> evaluate Beelay or separate encrypted transport
  -> do not block K1-K6 on this
```

### Runtime boxes after K3

```text
+------------------------------+
| Browser                       |
| - Automerge Repo              |
| - Local identity/contact card |
| - ACL client facade           |
| - Chat UI + invite UI         |
+--------------+---------------+
               |
               | HTTP bootstrap/invite + WS Automerge sync
               v
+------------------------------+
| Server                        |
| - Express API                 |
| - Automerge Repo relay        |
| - AccessControlAdapter        |
| - Invitation endpoints        |
+--------------+---------------+
               |
               | NodeFS now, later DB/object store
               v
+------------------------------+
| Storage                       |
| - Automerge documents         |
| - mock ACL state or Keyhive   |
|   archives/events             |
+------------------------------+
```

### Data that belongs in Automerge

Store UI-visible, mergeable chat/application state in Automerge:

- workspace name;
- channels;
- messages;
- members for display;
- role names for display;
- `keyhive` public reference IDs;
- non-secret invite status summaries if needed.

Do **not** store private keys, raw symmetric keys, signer secrets, or privileged Keyhive archive material in Automerge.

### Data that belongs in Keyhive/ACL storage

Store or derive access-control state outside the public workspace doc:

- local signer/private key material;
- Keyhive archive bytes;
- contact card material;
- membership events;
- delegation/revocation events;
- ciphertext store entries;
- Keyhive document/group objects or serialized references.

In mock mode, this can be a JSON or in-memory store. In real Keyhive mode, use Keyhive archive/event APIs.

## API Design

### Bootstrap response

Current browser bootstrap type already reserves `keyhive?: { workspaceGroupId; workspaceDocumentId }` (`packages/chat-web/src/features/bootstrap/bootstrapApi.ts:7-15`). Make the server actually return it.

```ts
interface BootstrapWorkspaceResponse {
  workspaceId: string
  workspaceDocUrl: string
  syncUrl: string
  keyhive: {
    workspaceGroupId: string
    workspaceDocumentId: string
  }
}
```

Server pseudocode:

```ts
router.post('/workspaces', async (req, res) => {
  const name = parseWorkspaceName(req.body)
  if (!name) return res.status(400).json({ error: 'name is required' })

  const workspaceId = newId('wk')
  const aclBundle = await acl.createWorkspace(name)

  const handle = repo.create(createWorkspaceDoc({
    workspaceId,
    name,
    createdAt: new Date().toISOString(),
    keyhive: {
      workspaceGroupId: aclBundle.workspaceGroupId,
      workspaceDocumentId: aclBundle.workspaceDocumentId,
      channelDocumentIds: {},
    },
  }))

  res.status(201).json({
    workspaceId,
    workspaceDocUrl: handle.url,
    syncUrl: syncUrl(config),
    keyhive: aclBundle,
  })
})
```

This requires `createWorkspaceDoc` to accept optional `keyhive` input or a post-create handle change.

### Identity/contact-card API

The browser should have a local identity. In mock mode, it can be generated from existing local identity state. In Keyhive mode, it comes from `Keyhive.idString` and `Keyhive.contactCard()`.

```ts
interface LocalAccessIdentity {
  memberId: string
  displayName: string
  agent: AgentRef
  publicKeyFingerprint: string
  contactCardJson: string
  mode: 'mock' | 'keyhive'
}
```

Potential browser-only API:

```ts
const identity = await accessClient.localIdentity()
await copyToClipboard(identity.contactCardJson)
```

### Receive contact card

```http
POST /api/invitations/contact-cards/receive
Content-Type: application/json

{
  "contactCard": { "...": "contact card JSON object or string" }
}
```

Response:

```json
{
  "agent": {
    "id": "agent_or_individual_id",
    "kind": "individual"
  },
  "displayName": "optional display name",
  "fingerprint": "short fingerprint"
}
```

Adapter call:

```ts
const agent = await acl.receiveContactCard(req.body.contactCard)
```

### Invite member

```http
POST /api/invitations
Content-Type: application/json

{
  "agent": { "id": "...", "kind": "individual" },
  "target": { "id": "wk_...", "kind": "workspace" },
  "access": "comment"
}
```

Response:

```json
{
  "ok": true,
  "agent": { "id": "...", "kind": "individual" },
  "target": { "id": "wk_...", "kind": "workspace" },
  "access": "comment",
  "membershipEvents": []
}
```

Mock implementation returns empty `membershipEvents`. Real Keyhive mode returns serialized event bytes from `eventsForAgent`, converted to base64 for JSON transport.

### Revoke member

```http
POST /api/invitations/revoke
Content-Type: application/json

{
  "agent": { "id": "...", "kind": "individual" },
  "target": { "id": "wk_...", "kind": "workspace" }
}
```

Response:

```json
{
  "ok": true,
  "membershipEvents": []
}
```

### Membership event sync

Do not invent a full Beelay protocol yet. Add a simple HTTP endpoint for spike/prototype event exchange:

```http
POST /api/keyhive/events/ingest
Content-Type: application/json

{
  "events": ["base64...", "base64..."]
}
```

Response:

```json
{
  "accepted": 2,
  "newEvents": ["base64..."]
}
```

This endpoint is not a final transport; it is a stepping stone for real Keyhive event export/ingest tests.

## UI Design

### Identity card

Add an `IdentityCard` component in the left panel or debug area.

Displays:

- display name;
- local member id;
- access mode (`mock` or `keyhive`);
- public key fingerprint;
- contact card availability;
- copy contact card button.

Actions:

- copy contact card;
- reset identity;
- maybe rotate/recreate identity in dev mode.

Storybook title:

```text
Molecules/IdentityCard
```

### Invite member form

Add an `InviteMemberForm` component.

Inputs:

- contact card JSON text area;
- target selector (`workspace` initially; channel later);
- access level selector (`read`, `comment`, `edit`, `admin`);
- submit button.

Outputs:

- parsed agent id/fingerprint preview;
- invite success/failure;
- debug log event.

Storybook title:

```text
Molecules/InviteMemberForm
```

### Debug log additions

The existing log pane should record:

- local ACL mode initialized;
- contact card copied;
- contact card received;
- invite sent;
- invite accepted;
- revoke sent;
- permission check failed;
- Keyhive event export/ingest counts;
- Keyhive archive save/load events.

### Workspace card additions

The workspace card should display:

- workspace group id;
- workspace document id;
- perhaps `ACL: mock` or `ACL: keyhive`;
- `Copy ACL refs` button if useful.

## Implementation Plan

### Phase K1: Wire mock ACL metadata into bootstrap

Files:

- `packages/chat-acl/src/index.ts`
- `packages/chat-core/src/workspace.ts`
- `packages/chat-server/src/app.ts`
- `packages/chat-server/src/http/bootstrap.ts`
- `packages/chat-server/test/bootstrap.test.ts`
- `packages/chat-web/src/features/bootstrap/bootstrapApi.ts`
- `packages/chat-web/src/components/molecules/WorkspaceCard/WorkspaceCard.tsx`

Steps:

1. Add an ACL adapter factory.

```ts
export interface AccessControlConfig {
  mode: 'mock' | 'keyhive'
  localMemberId?: string
}

export function createAccessControlAdapter(config: AccessControlConfig): AccessControlAdapter {
  if (config.mode === 'mock') return new InMemoryAccessControlAdapter(config.localMemberId ?? 'server-admin')
  throw new Error('keyhive ACL mode is not implemented yet')
}
```

2. Add ACL adapter to `createChatServer` dependencies.

```ts
export interface ChatServerDependencies {
  acl?: AccessControlAdapter
}

export function createChatServer(config: ServerConfig, deps: ChatServerDependencies = {}) {
  const acl = deps.acl ?? createAccessControlAdapter({ mode: 'mock' })
  app.use('/api/bootstrap', createBootstrapRouter(runtime.repo, config, acl))
}
```

3. Extend `createWorkspaceDoc` input to accept optional `keyhive`.

```ts
export interface CreateWorkspaceInput {
  workspaceId: WorkspaceId
  name: string
  createdAt: string
  keyhive?: KeyhiveRefs
}
```

4. In bootstrap, call `acl.createWorkspace(name)` before creating the Automerge doc.
5. Store `WorkspaceDoc.keyhive`.
6. Return `keyhive` in JSON response.
7. Update tests to assert both response and document state.
8. Update UI to display group/document IDs.

Acceptance criteria:

- `POST /api/bootstrap/workspaces` returns `keyhive`.
- Server-created workspace document contains matching `doc.keyhive`.
- Existing sync tests still pass.
- Web UI can show Keyhive refs even in mock mode.

### Phase K2: Add identity/contact-card UI in mock mode

Files:

- `packages/chat-web/src/features/access/identity.ts`
- `packages/chat-web/src/components/molecules/IdentityCard/*`
- `packages/chat-web/src/pages/HomePage/HomePage.tsx`
- `packages/chat-web/src/index.css`

Mock contact card shape:

```ts
interface AutodiscoContactCardV1 {
  kind: 'autodisco.contact-card.v1'
  mode: 'mock' | 'keyhive'
  displayName: string
  agent: AgentRef
  publicKey: string // base64
  createdAt: string
}
```

Pseudocode:

```ts
function getMockContactCard(identity): AutodiscoContactCardV1 {
  return {
    kind: 'autodisco.contact-card.v1',
    mode: 'mock',
    displayName: identity.displayName,
    agent: { id: identity.memberId, kind: 'individual' },
    publicKey: base64(identity.publicKey),
    createdAt: new Date().toISOString(),
  }
}
```

Acceptance criteria:

- Identity card renders local id/fingerprint.
- `Copy Contact Card` writes JSON to clipboard.
- Log pane records contact-card copy.
- Storybook story exists.

### Phase K3: Add invitation endpoints and UI

Files:

- `packages/chat-server/src/http/invitations.ts`
- `packages/chat-server/src/app.ts`
- `packages/chat-server/test/invitations.test.ts`
- `packages/chat-web/src/features/invitations/invitationsApi.ts`
- `packages/chat-web/src/components/molecules/InviteMemberForm/*`

Server router sketch:

```ts
export function createInvitationsRouter(acl: AccessControlAdapter): Router {
  const router = Router()

  router.post('/contact-cards/receive', async (req, res) => {
    const agent = await acl.receiveContactCard(req.body.contactCard)
    res.json({ agent })
  })

  router.post('/', async (req, res) => {
    const { agent, target, access } = parseInvite(req.body)
    await acl.assertCanAdmin(target.id)
    await acl.invite(agent, target, access)
    const membershipEvents = await acl.exportMembershipEventsFor(agent)
    res.status(201).json({ ok: true, agent, target, access, membershipEvents: membershipEvents.map(base64) })
  })

  router.post('/revoke', async (req, res) => {
    const { agent, target } = parseRevoke(req.body)
    await acl.assertCanAdmin(target.id)
    await acl.revoke(agent, target)
    const membershipEvents = await acl.exportMembershipEventsFor(agent)
    res.json({ ok: true, membershipEvents: membershipEvents.map(base64) })
  })

  return router
}
```

Acceptance criteria:

- Contact card receive returns an `AgentRef`.
- Invite endpoint grants mock access.
- Revoke endpoint removes mock access.
- Tests cover allowed and forbidden paths.
- UI can paste contact card and invite to workspace.

### Phase K4: App-layer ACL enforcement

This is not cryptographic security. It is application semantics and user feedback.

Browser send-message pseudocode:

```ts
async function sendMessage(channelId, body) {
  try {
    await accessClient.assertCanComment(channelId)
    handle.change(doc => sendMessageMutation(doc, ...))
    log.ok('Message sent')
  } catch (error) {
    log.error('Permission denied', error.message)
  }
}
```

Server invite pseudocode:

```ts
await acl.assertCanAdmin(target.id)
await acl.invite(agent, target, access)
```

Tests:

- mock grant permits comment;
- missing grant blocks comment;
- admin can invite;
- non-admin cannot invite;
- revoked agent cannot pass check.

### Phase K5: Keyhive WASM spike

Create either:

```text
packages/chat-acl-keyhive-spike
```

or tests under:

```text
packages/chat-acl/test/keyhive-wasm.spike.test.ts
```

Recommended first spike is browser/Vite/Playwright because upstream tests use Playwright and expose `window.keyhive` (`vendor-notes/keyhive_wasm-e2e-keyhive.spec.ts:1-7`). Node may work via package `exports.node` (`vendor-notes/keyhive_wasm-package.json:25-35`), but browser behavior matters for AUTODISCO.

Spike checklist:

1. Install or link `@keyhive/keyhive` alpha.
2. Configure Vite WASM/top-level await if needed. The package itself uses `vite-plugin-wasm` and `vite-plugin-top-level-await` in dev dependencies (`vendor-notes/keyhive_wasm-package.json:46-56`). AUTODISCO already uses `vite-plugin-wasm` for Automerge WASM.
3. Create Alice and Bob signers.
4. Initialize two Keyhives.
5. Export Alice contact card and have Bob receive it.
6. Alice creates workspace group and document.
7. Alice adds Bob with `read` or `edit`.
8. Export membership events for Bob.
9. Bob ingests or imports equivalent event/archive state.
10. Encrypt bytes for a document and verify Bob can decrypt.
11. Revoke Bob and verify future access semantics.
12. Archive Alice state and reload it.

Keyhive API sketch from upstream tests:

```ts
const { Keyhive, Signer, CiphertextStore, Access, ChangeId } = keyhive
const signer = await Signer.generate()
const store = CiphertextStore.newInMemory()
const kh = await Keyhive.init(signer, store, event => console.log(event))
const group = await kh.generateGroup([])
const doc = await kh.generateDocument([group.toPeer()], new ChangeId(new Uint8Array([1,2,3])), [])
const contactCard = await kh.contactCard()
const individual = await kh.receiveContactCard(contactCard)
await kh.addMember(individual.toAgent(), doc.toMembered(), Access.tryFromString('edit'), [])
```

Acceptance criteria:

- Produce a written spike result: works in Node, works in browser, or blocked.
- Record exact package version and build flags.
- Record any API mismatch with our `AccessControlAdapter`.
- Do not merge experimental Keyhive mode into production path until this is stable.

### Phase K6: Implement experimental KeyhiveAccessControlAdapter

Shape:

```ts
export class KeyhiveAccessControlAdapter implements AccessControlAdapter {
  constructor(private keyhive: KeyhiveRuntime) {}

  localMemberId(): string {
    return this.keyhive.idString
  }

  localPublicKey(): Uint8Array {
    return this.keyhive.id.bytes
  }

  async createWorkspace(name: string): Promise<WorkspaceAccessBundle> {
    const group = await this.keyhive.generateGroup([])
    const doc = await this.keyhive.generateDocument([group.toPeer()], initialChangeId(), [])
    return {
      workspaceGroupId: stringifyGroupId(group.groupId),
      workspaceDocumentId: stringifyDocId(doc.id),
    }
  }

  async receiveContactCard(cardJson: unknown): Promise<AgentRef> {
    const card = ContactCard.fromJson(asJsonString(cardJson))
    const individual = await this.keyhive.receiveContactCard(card)
    return { id: individual.idString ?? stringifyId(individual.id), kind: 'individual' }
  }

  async invite(agent: AgentRef, target: MemberedRef, access: ChatAccess): Promise<void> {
    const keyhiveAgent = await resolveAgent(agent)
    const membered = await resolveMembered(target)
    await this.keyhive.addMember(keyhiveAgent, membered, mapAccess(access), [])
  }
}
```

Do not make this the default. Add explicit config:

```ts
ACL_MODE=mock
ACL_MODE=keyhive-experimental
```

### Phase K7: Beelay/E2EE research track

Only after K5/K6. Questions to answer:

- Can we use Beelay directly, or is it not packaged/stable enough?
- Can Automerge Repo `shareConfig.access` receive enough peer identity context?
- How will browser peers authenticate to relay?
- Where are encrypted Automerge chunks stored?
- How do bots obtain access without weakening user security?
- How do revocations trigger key rotation / `forcePcsUpdate`?

## Testing Strategy

### Unit tests

- `InMemoryAccessControlAdapter` grant/read/comment/admin/revoke behavior.
- Contact card parsing and validation.
- Access mapping `ChatAccess -> Keyhive Access`.
- Bootstrap returns and stores ACL refs.

### Integration tests

- Workspace bootstrap creates Automerge doc with `keyhive` refs.
- Invite endpoint grants mock access and returns event array.
- Revoke endpoint removes mock access.
- Attempted invite without admin fails.
- Attempted send without comment permission fails once enforcement is added.

### Browser tests

- Identity card renders and copies contact card.
- Invite form accepts contact card JSON and invites a second context.
- Two-context sync still works after ACL metadata is added.
- Permission-denied path logs a visible debug entry.

### Keyhive spike tests

- `Keyhive.init` works in the target environment.
- `contactCard` / `receiveContactCard` round trip works.
- `generateGroup` creates admin membership.
- `generateDocument` creates a document id.
- `addMember` and `revokeMember` complete.
- `eventsForAgent` exports non-empty bytes after membership operations.
- Archive save/load works.
- Encrypt/decrypt works for authorized peer.

### Validation commands

```bash
npm run typecheck
npm test
npm run build
npm --workspace @autodisco/chat-web run build-storybook
devctl check --timeout 300s
devctl test-web-sync --timeout 120s
```

For Keyhive spike packages, add package-specific commands once created.

## Risks and Mitigations

### Risk: Keyhive is pre-alpha

Evidence: the notebook says the code is an early preview, may contain bugs/inconsistencies/unstable APIs, and has not been security audited (`sources/web/keyhive-notebook.md:400-410`).

Mitigation:

- Keep mock mode as stable default.
- Put real Keyhive behind `keyhive-experimental` mode.
- Record exact package version.
- Do not claim production security.

### Risk: App-layer ACL can be bypassed

If a malicious browser knows the Automerge URL and can sync through the relay, it can craft local changes. App-layer checks are not cryptographic enforcement.

Mitigation:

- Label K4 as semantic enforcement, not security enforcement.
- Do not rely on it for production.
- Continue toward encrypted transport and authenticated sync.

### Risk: URL sharing conflicts with access control

The current join link copies raw document and sync URLs. This is useful for testing but undermines the mental model that invitations control access.

Mitigation:

- Keep join links as developer/debug workflow.
- Add real invite/contact-card flow.
- Later, make join links carry invitation material rather than raw doc-only access.

### Risk: Access mapping is lossy

AUTODISCO has `comment`, Keyhive has `edit`. Mapping `comment -> edit` grants too much at the Keyhive layer.

Mitigation:

- Use Keyhive for coarse crypto access.
- Use app-level semantics for fine-grained chat actions.
- Consider separate channel documents for finer cryptographic boundaries.

### Risk: Bot access becomes a privilege hole

Bots need read/comment access to channels, but bot workers can leak context to external LLMs/tools.

Mitigation:

- Model bots as explicit agents.
- Invite bots to channels like users.
- Log bot access grants.
- Keep bot permissions minimal.

## Alternatives Considered

### Alternative 1: Build real Keyhive first, then UI

Rejected as the default path because Keyhive is unstable and the product flow needs to be understandable independently. A mock-backed UI lets us verify UX, API boundaries, and app semantics now.

### Alternative 2: Store roles only inside Automerge

Rejected as a security mechanism. Automerge role fields are useful for UI and moderation display, but they do not provide cryptographic access control, pull control, or encrypted byte gating.

### Alternative 3: Replace Automerge Repo sync immediately with Beelay

Deferred. Beelay is the long-term conceptual fit, but the current app already has reliable Automerge Repo sync and tests. Replacing transport before proving identity/contact-card/member flows would create too many moving parts.

### Alternative 4: Treat join URL as the invitation system

Rejected for real access control. Join URLs are fine for debugging and developer demos, but Keyhive invitations need contact cards, membership operations, and eventually event/key material.

## Open Questions

1. What is the exact package installation path for `@keyhive/keyhive` in this repo: npm package, workspace link to vendored source, or git dependency?
2. Does Keyhive WASM work cleanly under Node tests, or should the real spike be browser/Playwright first?
3. Can Automerge Repo `shareConfig.access` receive authenticated Keyhive identity context, or is Beelay required for real access-aware sync?
4. How should Keyhive archives/events be persisted in browser and server storage?
5. Should workspace group/document IDs be visible to users or only in debug panels?
6. How should AUTODISCO distinguish `comment` from `edit` once Keyhive only has `edit`?
7. How should revocation interact with existing Automerge history in a chat product where users usually expect old messages to remain visible to current members?

## Recommended First Pull Request

The first implementation PR should be intentionally small:

**Title:** `Wire mock ACL metadata into workspace bootstrap`

Scope:

- Add ACL adapter factory.
- Inject ACL adapter into `createChatServer`.
- Extend `createWorkspaceDoc` input with optional `keyhive`.
- Call `acl.createWorkspace(name)` in bootstrap.
- Store refs in workspace doc.
- Return refs in bootstrap response.
- Update bootstrap tests.
- Display refs in `WorkspaceCard` or debug log.
- Update diary/changelog/tasks.

Validation:

```bash
npm run typecheck
npm test
npm run build
devctl check --timeout 300s
```

This PR does not need real Keyhive. It establishes the schema/API contract that real Keyhive will later satisfy.

## References

### Current AUTODISCO code

- `packages/chat-acl/src/index.ts:1-36` — adapter types and operations.
- `packages/chat-acl/src/index.ts:45-127` — in-memory mock adapter.
- `packages/chat-core/src/types.ts:89-108` — `KeyhiveRefs` and optional workspace `keyhive` slot.
- `packages/chat-server/src/http/bootstrap.ts:10-30` — current workspace bootstrap response.
- `packages/chat-server/src/http/bootstrap.ts:33-36` — placeholder invitation endpoint.
- `packages/chat-server/src/repo.ts:14-24` — Automerge relay runtime and `sharePolicy`.
- `packages/chat-web/src/features/bootstrap/bootstrapApi.ts:7-15` — web bootstrap type already reserving optional `keyhive` response.
- `packages/chat-web/src/features/automerge/repo.ts:7-17` — browser Repo setup.
- `packages/chat-web/src/pages/HomePage/HomePage.tsx:31-131` — browser workspace/create/open/log/send flow.
- `packages/chat-web/src/pages/HomePage/HomePage.tsx:137-150` — join-link query parsing.

### Captured Keyhive sources

- `sources/web/keyhive-notebook.md:126-148` — groups, delegations, encrypted-at-rest content, pull control.
- `sources/web/keyhive-notebook.md:400-410` — pre-alpha/no-production warning.
- `sources/web/keyhive-notebook.md:414-428` — Beelay overview and sync order.
- `sources/web/keyhive-notebook.md:502-520` — signed message envelope sketch.
- `sources/web/keyhive-notebook.md:522-588` — membership graph and document collection sync.
- `vendor-notes/keyhive_wasm_js_api.rs:65-82` — `Keyhive.init`.
- `vendor-notes/keyhive_wasm_js_api.rs:117-166` — group/document generation.
- `vendor-notes/keyhive_wasm_js_api.rs:174-227` — encrypt/decrypt.
- `vendor-notes/keyhive_wasm_js_api.rs:230-272` — add/revoke member.
- `vendor-notes/keyhive_wasm_js_api.rs:316-349` — contact-card API.
- `vendor-notes/keyhive_wasm_js_api.rs:377-426` — event export.
- `vendor-notes/keyhive_wasm-package.json:1-45` — package name, version, exports.
- `vendor-notes/keyhive_wasm-e2e-keyhive.spec.ts:21-300` — upstream practical browser usage examples.
