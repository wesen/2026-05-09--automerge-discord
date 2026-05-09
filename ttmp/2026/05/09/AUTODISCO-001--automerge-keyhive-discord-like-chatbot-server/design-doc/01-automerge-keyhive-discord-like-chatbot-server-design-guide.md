---
Title: Automerge Keyhive Discord-like Chatbot Server Design Guide
Ticket: AUTODISCO-001
Status: active
Topics:
    - automerge
    - keyhive
    - crdt
    - discord
    - chatbot
    - access-control
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/scripts/automerge-chat-model-smoke.mjs
      Note: Runnable Automerge merge smoke experiment
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/sources/web/01-automerge-concepts.md
      Note: Captured Automerge core concepts used in the design guide
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/sources/web/04-automerge-networking.md
      Note: Captured WebSocket network adapter references
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/sources/web/06-automerge-repositories.md
      Note: Captured Automerge Repo API references
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/sources/web/08-keyhive-notebook.md
      Note: Captured Keyhive and Beelay design references
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/vendor/automerge-repo-sync-server/src/server.js
      Note: Upstream sync server implementation used as Node relay reference
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/vendor/keyhive/keyhive_wasm/src/js/keyhive.rs
      Note: Keyhive WASM API surface used in adapter design
ExternalSources:
    - https://automerge.org/docs/reference/concepts/
    - https://automerge.org/docs/reference/repositories/
    - https://automerge.org/docs/reference/repositories/networking/
    - https://www.inkandswitch.com/keyhive/notebook/
    - https://github.com/inkandswitch/keyhive
Summary: Design and implementation guide for a Discord-like chatbot server using Automerge CRDT documents and Keyhive/Beelay-style access control.
LastUpdated: 2026-05-09T12:45:00-04:00
WhatFor: Use when implementing the first prototype or onboarding an intern to the architecture.
WhenToUse: Before writing server code, defining document schemas, or deciding how CRDT sync and access control interact.
---


# Automerge Keyhive Discord-like Chatbot Server Design Guide

## Executive Summary

We want a Discord-like chatbot server where users can create workspaces, channels, messages, bot personas, and bot runs, while also getting collaborative offline editing and decentralized access control. The right mental model is not “a normal chat server that happens to store JSON.” It is a local-first collaboration system whose durable application state lives in Automerge CRDT documents, whose network layer moves Automerge changes between peers, and whose authorization layer is based on Keyhive membership/capability operations.

Automerge gives us the CRDT substrate. Its documentation describes an Automerge document as the unit of change, shaped like a JSON object with a Git-like commit history where independently edited replicas can always be merged (`sources/web/01-automerge-concepts.md:11-15`). `automerge-repo` adds repository, storage, document handle, and network plumbing (`sources/web/01-automerge-concepts.md:7`, `sources/web/06-automerge-repositories.md:1-3`). The repository gives out `DocHandle`s that application code mutates and observes (`sources/web/01-automerge-concepts.md:19-25`, `sources/web/06-automerge-repositories.md:21-33`).

Keyhive gives us the intended access-control direction. The repository is explicitly pre-alpha and not production-ready (`vendor/keyhive/README.md:15-18`), so this guide treats Keyhive integration as an architectural track with a prototype boundary, not as a security promise for a shipped product. The APIs already expose the concepts we need: identities, groups, documents, encryption/decryption, add/revoke member, reachable docs, contact cards, event export/ingest, and membership queries (`vendor/keyhive/keyhive_wasm/src/js/keyhive.rs:65-349`, `:377-426`). Beelay, the Keyhive sync protocol described by Ink & Switch, authenticates messages with Ed25519, syncs the membership graph first, then syncs document collections and individual encrypted documents (`sources/web/08-keyhive-notebook.md:403-410`, `:503-590`).

For the first intern-friendly implementation, build a Node/TypeScript prototype with three layers:

1. **Automerge application model:** one server/workspace document plus optional per-channel documents for message history once channels become large.
2. **Relay/sync server:** an Express/WebSocket service based on `@automerge/automerge-repo` and `@automerge/automerge-repo-network-websocket`, initially using Node filesystem storage like the upstream sync server (`vendor/automerge-repo-sync-server/src/server.js:41-50`).
3. **Access-control adapter:** a Keyhive-backed facade that maps Discord concepts (`server`, `channel`, `role`, `member`, `bot`) to Keyhive groups/documents/capabilities, with an explicit “mock Keyhive” option for early UI/server development.

The key design decision is to keep chat semantics in Automerge documents and keep authorization semantics in Keyhive membership events. Do not encode access control only as mutable fields inside the Automerge document; that would be useful for UI display but insufficient for cryptographic access control.

## Problem Statement and Scope

The product target is a collaborative, Discord-like chatbot server. “Discord-like” means users expect a server/workspace, channels, members, roles, messages, reactions, attachments, slash commands, and bots that can read context and write responses. “Automerge + Keyhive” means the server should not be the sole source of truth. Clients should be able to edit offline, merge later, and sync through relays that do not need to understand all plaintext application content.

The intern implementing this system needs to understand four independent domains before writing code:

- **CRDT state:** Automerge documents are mutable JSON-like objects with conflict-free merge semantics.
- **Repository sync:** `automerge-repo` manages document handles, local storage, and network adapters.
- **Access control:** Keyhive represents individuals, groups, documents, delegation, revocation, encryption, and syncable membership events.
- **Chatbot orchestration:** bots are application agents that observe channel context and append messages or structured run records.

### In scope for the first prototype

- A TypeScript service that can create a workspace document, channels, members, messages, reactions, and bot run records.
- A browser or CLI client that connects to a WebSocket Automerge repo relay.
- A simple bot worker that watches messages and appends bot responses.
- A Keyhive adapter interface with an in-memory/mock implementation and a real pre-alpha integration spike.
- Documentation and tests that explain data shape, merge behavior, and access checks.

### Out of scope for the first prototype

- Production cryptographic security. Keyhive warns that the release is pre-alpha, unstable, and unaudited (`vendor/keyhive/README.md:15-18`).
- Full Discord parity: voice, stage channels, moderation queues, embeds, CDN-scale attachments, webhook signing, and mobile push notifications.
- A custom Beelay implementation unless the Keyhive crate APIs are ready enough. The prototype can run Automerge repo sync for plaintext/local development and preserve an adapter boundary for Beelay-compatible encrypted sync.

## Current-State Evidence

### Automerge documents and repository model

Automerge stores application state in documents. A document is JSON-like data with maps, arrays, strings, numbers, and nested values, but it also has a commit history that supports merging independent edits (`sources/web/01-automerge-concepts.md:11-15`). This matters for chat because two users can concurrently create channels, add messages, or update display names without a central sequence coordinator.

`automerge-repo` adds the operational layer. The Automerge docs state that JavaScript applications are composed from `automerge-repo` for networking/storage and `automerge` for the CRDT, transport-agnostic sync protocol, and compact storage format (`sources/web/01-automerge-concepts.md:7`). A repository manages connections and storage and hands out `DocHandle`s so application code does not need to manually store or transmit every change (`sources/web/01-automerge-concepts.md:19-25`).

A minimal Node repository with a WebSocket server adapter and filesystem storage is already shown in the docs (`sources/web/06-automerge-repositories.md:7-18`). The official sync server follows the same pattern: it creates a `WebSocketServerAdapter`, a `NodeFSStorageAdapter`, a server peer ID, and a `Repo` (`vendor/automerge-repo-sync-server/src/server.js:41-50`).

### Networking model

Automerge repo networking is adapter-based. A repository can have multiple `NetworkAdapter`s, and “network” means any message-passing connection to another `Repo`, not only IP networking (`sources/web/04-automerge-networking.md:1-3`). WebSocket sync has server and client adapters (`sources/web/04-automerge-networking.md:5-19`, `:41-49`), and the docs show how to mount a WebSocket server inside an Express HTTP server (`sources/web/04-automerge-networking.md:21-39`).

This is directly applicable to a Discord-like server. The HTTP service can expose REST endpoints for bootstrap/login and WebSocket endpoints for Automerge sync. The WebSocket path is not an application-level “send message” endpoint; it is the replication pipe for CRDT changes.

### Keyhive and Beelay model

Keyhive provides access control and encryption concepts for local-first applications. Its README identifies three relevant packages: `beelay-core` for auth-enabled sync over end-to-end encrypted data, `keyhive_core` for signing/encryption/delegation, and `keyhive_wasm` for TypeScript bindings (`vendor/keyhive/README.md:8-12`). The warning is important: this is pre-alpha, unaudited code and should not be used as a production security boundary yet (`vendor/keyhive/README.md:15-18`).

The Keyhive WASM API exposes the pieces a TypeScript prototype needs:

- `Keyhive.init(signer, ciphertextStore, eventHandler)` creates an identity and local Keyhive state (`vendor/keyhive/keyhive_wasm/src/js/keyhive.rs:65-82`).
- `generateGroup` and `generateDocument` create access-control groups and document principals (`:117-166`).
- `tryEncrypt`, `tryDecrypt`, and `forcePcsUpdate` support encrypted document content and key updates (`:174-227`, `:292-300`).
- `addMember` and `revokeMember` produce delegation/revocation effects (`:230-272`).
- `contactCard` and `receiveContactCard` support user/device introduction (`:316-349`).
- `eventsForAgent` exports membership, prekey, and CGKA events for an agent (`:377-426`).

Beelay’s notebook describes a sync order that should shape our design: authenticate messages, sync Keyhive membership graph, sync the document collection, and then sync individual documents (`sources/web/08-keyhive-notebook.md:407-410`). It also explains that peers are represented by individuals with Ed25519 public keys and that authentication must bind signed messages to sender, audience, and timestamp (`sources/web/08-keyhive-notebook.md:429-501`).

## System Overview

The system is easiest to understand as four boxes:

```text
+-------------------+        +----------------------+        +-------------------+
| Browser / CLI     |  WS    | Relay / App Server   |  Jobs  | Bot Worker        |
| - Repo            |<------>| - HTTP API           |<------>| - LLM/tool calls  |
| - Automerge docs  |       | - Automerge Repo     |        | - Automerge Repo  |
| - Keyhive client  |       | - optional Beelay    |        | - service identity|
+---------+---------+        +----------+-----------+        +---------+---------+
          |                             |                              |
          | local storage                | persistent storage           | local storage
          v                             v                              v
+-------------------+        +----------------------+        +-------------------+
| IndexedDB/files   |        | NodeFS/object store  |        | files/DB          |
+-------------------+        +----------------------+        +-------------------+
```

The server is not a traditional command authority. It is a relay, bootstrapper, bot coordinator, and optional policy enforcement point. Clients and bot workers mutate Automerge documents through handles. Access control gates which document URLs a peer can learn, which encrypted bytes it can pull, and which changes the application should accept as semantically authorized.

### Responsibilities by component

| Component | Responsibilities | Should not do |
| --- | --- | --- |
| Browser/CLI client | Render channels, create local changes, maintain local repo storage, sign/encrypt through Keyhive, sync over WebSocket. | Trust server order as the only source of truth. |
| Relay/app server | Serve bootstrap HTTP, host WebSocket repo adapter, persist document changes, run coarse admission checks, enqueue bot jobs. | Inspect encrypted content in the future E2EE mode. |
| Bot worker | Watch channels it has access to, run chatbot logic, append bot messages and run records. | Bypass the same CRDT and access-control paths used by users. |
| Keyhive adapter | Manage identities, groups, document capabilities, encryption/decryption, membership event sync. | Hide pre-alpha status or promise audited security. |
| Automerge repository | Store and sync documents. | Decide application-level permissions by itself. |

## Data Model

Start with one **workspace document** per Discord-like server. It is the root object users open after login or invitation. Keep values JSON-like because Automerge documents naturally store maps, arrays, and scalars (`sources/web/01-automerge-concepts.md:11-13`).

### Workspace document schema

```typescript
type WorkspaceDoc = {
  schemaVersion: 1
  workspaceId: string
  name: string
  createdAt: string

  categories: Record<CategoryId, CategoryRecord>
  channels: Record<ChannelId, ChannelRecord>
  members: Record<MemberId, MemberRecord>
  roles: Record<RoleId, RoleRecord>

  // Small channels can live here during the prototype.
  // Large channels should move to per-channel documents.
  messagesByChannel: Record<ChannelId, MessageRecord[]>

  botConfigs: Record<BotId, BotConfig>
  botRuns: Record<BotRunId, BotRunRecord>

  keyhive?: {
    workspaceGroupId: string
    workspaceDocumentId: string
    channelDocumentIds: Record<ChannelId, string>
  }
}
```

```typescript
type ChannelRecord = {
  id: ChannelId
  name: string
  kind: 'text' | 'bot-lab' | 'announcement'
  categoryId: CategoryId | null
  topic?: string
  createdBy: MemberId
  createdAt: string
  archived?: boolean
  messageDocUrl?: string // set when messages are split into a per-channel document
}

type MessageRecord = {
  id: MessageId
  authorId: MemberId | BotId
  body: string
  createdAt: string
  editedAt?: string
  replyTo?: MessageId
  reactions: Record<string, MemberId[]>
  attachments?: AttachmentRef[]
  botRunId?: BotRunId
}
```

The smoke experiment in `scripts/automerge-chat-model-smoke.mjs` validates the basic modeling assumption. It creates two independent replicas, Alice and Bob make concurrent channel/member/message changes, and `A.merge(alice, bob)` produces a document with both `general` and `bots` channels plus both members (`scripts/automerge-chat-model-smoke.mjs:19-43`). The first run failed because I assumed `A.merge` returned an iterable pair; current `@automerge/automerge` returns the merged document directly. That failure is recorded in the diary and is useful API evidence.

### Per-channel message documents

A single workspace document is fine for the first prototype, but a chat server’s hot path is message append. Large or busy channels should move messages into per-channel Automerge documents so a user can sync only the channels they can access.

```typescript
type ChannelMessagesDoc = {
  schemaVersion: 1
  workspaceId: string
  channelId: string
  messages: MessageRecord[]
  checkpoints: {
    lastCompactedAt?: string
    approximateMessageCount: number
  }
}
```

This split aligns with Keyhive’s “documents can have members which can access the document” model (`sources/web/08-keyhive-notebook.md:421-423`). A private channel can be a separate Keyhive document/group. A public channel can inherit from the workspace group.

## Access-Control Model

The UI can display roles such as `admin`, `moderator`, `member`, and `bot`, but the cryptographic authority should be expressed as Keyhive groups and document capabilities.

### Mapping Discord concepts to Keyhive concepts

| Discord-like concept | Keyhive concept | Notes |
| --- | --- | --- |
| User device | Individual | Keyhive represents an individual with an immutable Ed25519 public key (`sources/web/08-keyhive-notebook.md:415-416`). |
| User account/person | Group containing device individuals | Keyhive notes that a person can be represented as a group whose devices are individual members (`sources/web/08-keyhive-notebook.md:415-416`). |
| Workspace/server | Group and root workspace document | The workspace group delegates access to users and bots. |
| Role | Group | A role group can be a member of workspace/channel documents. |
| Channel | Document, optionally with its own group | Private channels get separate document membership. |
| Bot | Individual or group | A bot service identity should be added like any other participant. |
| Invitation | Contact-card exchange plus `addMember` | `contactCard` and `receiveContactCard` support introductions (`vendor/keyhive/keyhive_wasm/src/js/keyhive.rs:316-349`). |
| Kick/ban | `revokeMember` | Revocation is exposed by the API (`vendor/keyhive/keyhive_wasm/src/js/keyhive.rs:254-272`). |

### Access levels

Use an application-level enum that can map onto Keyhive `Access` values while preserving Discord semantics:

```typescript
type ChatAccess =
  | 'pull'      // may retrieve ciphertext/metadata; not enough to decrypt or post
  | 'read'      // may decrypt/read channel content
  | 'comment'   // may send normal messages/reactions
  | 'edit'      // may modify channel metadata and bot configs
  | 'admin'     // may delegate/revoke and manage roles
```

Keyhive’s notebook distinguishes pull from read/write-like access because sync servers should not make ciphertext retrievable by everyone (`sources/web/08-keyhive-notebook.md:129-137`). In the first prototype, enforce `comment/edit/admin` at the app layer before writing UI-visible changes. In the later encrypted design, only authorized peers should receive or decrypt the underlying bytes.

## API Design

There are two API surfaces: bootstrap HTTP and CRDT sync. Avoid building a conventional REST API for every chat mutation. Chat mutations should be Automerge changes so offline clients and bots use the same path.

### HTTP bootstrap API

```http
POST /api/bootstrap/workspaces
Authorization: Bearer <session-token>
Content-Type: application/json

{ "name": "Intern Guild" }
```

Response:

```json
{
  "workspaceId": "wk_123",
  "workspaceDocUrl": "automerge:...",
  "syncUrl": "wss://example.test/sync",
  "keyhive": {
    "workspaceGroupId": "...",
    "workspaceDocumentId": "..."
  }
}
```

```http
POST /api/invitations/accept
Content-Type: application/json

{
  "inviteCode": "...",
  "contactCard": { "...": "Keyhive contact card JSON" }
}
```

Response:

```json
{
  "workspaceDocUrl": "automerge:...",
  "syncUrl": "wss://example.test/sync",
  "membershipEvents": ["base64-event-bytes"]
}
```

### Client Automerge API wrapper

```typescript
class ChatClient {
  constructor(private repo: Repo, private acl: AccessControlAdapter) {}

  async openWorkspace(url: AutomergeUrl): Promise<DocHandle<WorkspaceDoc>> {
    await this.acl.assertCanRead(url)
    return this.repo.find<WorkspaceDoc>(url)
  }

  async sendMessage(workspace: DocHandle<WorkspaceDoc>, channelId: string, body: string) {
    await this.acl.assertCanComment(channelId)
    workspace.change(doc => {
      const msg: MessageRecord = {
        id: newId('msg'),
        authorId: this.acl.localMemberId(),
        body,
        createdAt: new Date().toISOString(),
        reactions: {},
      }
      doc.messagesByChannel[channelId].push(msg)
    })
  }
}
```

This wrapper is intentionally thin. `DocHandle.change` is the core mutation boundary, matching Automerge’s documented pattern where a handle makes changes and listens for remote changes (`sources/web/06-automerge-repositories.md:23-30`).

### Access-control adapter interface

```typescript
interface AccessControlAdapter {
  localMemberId(): string
  localPublicKey(): Uint8Array

  createWorkspace(name: string): Promise<WorkspaceAccessBundle>
  createChannel(workspace: WorkspaceAccessBundle, channelId: string, visibility: ChannelVisibility): Promise<ChannelAccessBundle>

  receiveContactCard(cardJson: unknown): Promise<AgentRef>
  invite(agent: AgentRef, target: MemberedRef, access: ChatAccess): Promise<void>
  revoke(agent: AgentRef, target: MemberedRef): Promise<void>

  assertCanRead(docOrChannel: string): Promise<void>
  assertCanComment(channelId: string): Promise<void>
  assertCanAdmin(target: string): Promise<void>

  exportMembershipEventsFor(agent: AgentRef): Promise<Uint8Array[]>
  ingestMembershipEvents(events: Uint8Array[]): Promise<Uint8Array[]> // returns still-pending deps
}
```

The real implementation can call `Keyhive.init`, `generateGroup`, `generateDocument`, `addMember`, `revokeMember`, `eventsForAgent`, and `ingestEventsBytes` based on the observed WASM methods (`vendor/keyhive/keyhive_wasm/src/js/keyhive.rs:65-82`, `:117-166`, `:230-272`, `:377-426`, `:600-626`). The mock implementation can use simple maps so the Automerge and bot layers can be built before the Keyhive integration is stable.

## Core Flows

### Flow 1: Create a workspace

```text
User clicks "Create server"
  -> HTTP POST /api/bootstrap/workspaces
  -> server creates Automerge workspace doc
  -> ACL adapter creates Keyhive workspace group/document
  -> server stores doc URL + Keyhive IDs
  -> client opens doc via Repo and sync URL
```

Pseudocode:

```typescript
async function createWorkspace(req) {
  const owner = await authenticate(req)
  const acl = await keyhiveFor(owner)

  const workspaceAccess = await acl.createWorkspace(req.body.name)
  const handle = repo.create<WorkspaceDoc>({
    schemaVersion: 1,
    workspaceId: newId('wk'),
    name: req.body.name,
    createdAt: now(),
    categories: {},
    channels: {},
    members: {},
    roles: {},
    messagesByChannel: {},
    botConfigs: {},
    botRuns: {},
    keyhive: workspaceAccess.publicRefs,
  })

  return {
    workspaceDocUrl: handle.url,
    syncUrl: publicSyncUrl(),
    keyhive: workspaceAccess.publicRefs,
  }
}
```

### Flow 2: Send a message offline and merge later

```text
Alice and Bob both start from the same workspace document.
Alice creates #general and sends m1 while offline.
Bob creates #bots and bot sends m2 while offline.
When either replica syncs, Automerge merges both independent changes.
```

This exact shape is tested by `scripts/automerge-chat-model-smoke.mjs`. The successful output showed both channels and both members after merge:

```json
{
  "channels": ["bots", "general"],
  "members": ["alice", "bot"],
  "generalMessages": 1,
  "botMessages": 1
}
```

### Flow 3: Invite a bot

```text
Bot worker publishes a Keyhive contact card.
Admin receives the contact card.
Admin adds the bot agent to the workspace or channel with comment/edit access.
Membership events sync to the bot.
Bot opens only reachable docs and appends bot messages through Automerge.
```

Pseudocode:

```typescript
async function inviteBot(adminAcl, botContactCard, workspaceDoc, channelId) {
  const botIndividual = await adminAcl.receiveContactCard(botContactCard)
  const target = await adminAcl.memberedForChannel(channelId)
  await adminAcl.invite(botIndividual.toAgent(), target, 'comment')

  workspaceDoc.change(doc => {
    doc.members[`bot:${botIndividual.id}`] = {
      displayName: 'Helper Bot',
      roles: ['bot'],
    }
  })
}
```

### Flow 4: Bot response

```text
Bot worker watches a channel document.
New user message appears.
Bot creates a botRun record with status=running.
Bot calls model/tools.
Bot appends a message and marks botRun status=completed.
All changes sync as normal CRDT edits.
```

Pseudocode:

```typescript
channelHandle.on('change', async ({ doc }) => {
  const work = findUnansweredMentions(doc.messages, botId)
  for (const mention of work) {
    channelHandle.change(d => {
      d.botRuns[mention.id] = { status: 'running', startedAt: now(), promptMessageId: mention.id }
    })

    const answer = await llm.complete(buildContext(doc.messages, mention))

    channelHandle.change(d => {
      d.messages.push({
        id: newId('msg'),
        authorId: botId,
        body: answer.text,
        createdAt: now(),
        reactions: {},
        botRunId: mention.id,
      })
      d.botRuns[mention.id].status = 'completed'
      d.botRuns[mention.id].completedAt = now()
    })
  }
})
```

## Implementation Plan

### Phase 0: Repository scaffold and documentation

Create a TypeScript monorepo:

```text
packages/
  chat-core/          # schemas, IDs, Automerge helper functions
  chat-server/        # Express/WebSocket relay and HTTP bootstrap
  chat-client/        # browser/CLI client library
  chat-bot-worker/    # bot runtime
  chat-acl/           # Keyhive adapter and mock adapter
```

Tasks:

- Add `typescript`, `vitest`, `tsx`, `@automerge/automerge`, `@automerge/automerge-repo`, `@automerge/automerge-repo-network-websocket`, and storage adapters.
- Copy the smoke experiment into `packages/chat-core/test` and turn it into a Vitest test.
- Define branded IDs (`WorkspaceId`, `ChannelId`, `MessageId`) so strings are not accidentally mixed.

### Phase 1: Automerge data model

Implement pure functions that mutate documents through `DocHandle.change`:

- `createChannel(doc, input)`
- `archiveChannel(doc, channelId)`
- `sendMessage(doc, channelId, input)`
- `editMessage(doc, messageId, body)`
- `addReaction(doc, messageId, emoji)`
- `createBotRun(doc, input)`
- `completeBotRun(doc, runId, output)`

Validation rule: every mutation should be deterministic except for IDs/timestamps supplied by the caller. This makes tests reproducible.

### Phase 2: Relay/app server

Implement Express with an embedded WebSocket server following the documented pattern (`sources/web/04-automerge-networking.md:21-39`) and the official sync server’s `Repo` setup (`vendor/automerge-repo-sync-server/src/server.js:41-50`).

Files to create:

```text
packages/chat-server/src/main.ts
packages/chat-server/src/repo.ts
packages/chat-server/src/http/bootstrap.ts
packages/chat-server/src/config.ts
```

Pseudocode:

```typescript
const wss = new WebSocketServer({ noServer: true })
const repo = new Repo({
  network: [new WebSocketServerAdapter(wss, 60_000)],
  storage: new NodeFSStorageAdapter(config.dataDir),
  peerId: `chat-relay-${hostname()}` as PeerId,
  sharePolicy: async (peerId, documentId) => aclMayShare(peerId, documentId),
})

server.on('upgrade', (request, socket, head) => {
  authenticateUpgrade(request)
  wss.handleUpgrade(request, socket, head, socket => wss.emit('connection', socket, request))
})
```

The upstream public sync server uses `sharePolicy: async () => false` so it only syncs documents clients already know by ID (`vendor/automerge-repo-sync-server/src/server.js:46-48`). Our prototype can begin this way, then add ACL-aware sharing once peer identity is bound to Keyhive identity.

### Phase 3: Mock ACL adapter

Before integrating Keyhive, build a mock adapter with the same interface:

```typescript
class InMemoryAccessControlAdapter implements AccessControlAdapter {
  private grants = new Map<string, Set<ChatAccess>>()
  async assertCanComment(channelId: string) {
    if (!this.has(channelId, 'comment')) throw new ForbiddenError()
  }
}
```

This lets the intern test UI, bot, and Automerge behavior without blocking on pre-alpha crypto APIs.

### Phase 4: Keyhive integration spike

Create a small package that loads `keyhive_wasm`, generates two identities, exchanges a contact card, creates a document, adds a member, encrypts/decrypts bytes, exports events for the second agent, and ingests them into another Keyhive. Use the real methods identified in `keyhive.rs`.

Acceptance criteria:

- `Keyhive.init` works in Node or browser test environment.
- `generateDocument` creates a document principal.
- `contactCard`/`receiveContactCard` introduces a second identity.
- `addMember` gives access to the second identity.
- `tryEncrypt`/`tryDecrypt` round-trips content for authorized members.
- `revokeMember` changes future access behavior.
- `eventsForAgent` and `ingestEventsBytes` can transfer membership state.

### Phase 5: Bot worker

The bot worker should be a normal Automerge peer with a Keyhive identity. It should not call private server APIs to insert messages. It should open docs it can access and write changes through Automerge. That keeps bot output mergeable and auditable.

Files to create:

```text
packages/chat-bot-worker/src/main.ts
packages/chat-bot-worker/src/watch.ts
packages/chat-bot-worker/src/respond.ts
packages/chat-bot-worker/src/context.ts
```

### Phase 6: E2EE/Beelay-compatible sync path

Only start this after Phase 4 proves Keyhive basics. Follow the Beelay design order:

1. Authenticate peer messages using signed envelopes with sender, audience, and timestamp (`sources/web/08-keyhive-notebook.md:435-501`).
2. Sync membership graph first (`sources/web/08-keyhive-notebook.md:503-549`).
3. Sync document collection by document ID and state hash (`sources/web/08-keyhive-notebook.md:555-565`).
4. Sync per-document CGKA ops and encrypted content chunks (`sources/web/08-keyhive-notebook.md:567-590`).

## Testing and Validation Strategy

### Unit tests

- CRDT merge tests: concurrent channel creation, concurrent message append, concurrent reaction changes, message edit plus reaction.
- Schema migration tests: load `schemaVersion: 1` and migrate to future versions.
- ACL tests: mock grants allow/deny expected operations.
- Bot idempotency tests: same mention should not produce duplicate bot runs after resync/restart.

### Integration tests

- Start relay server with filesystem storage.
- Start two clients with separate local repos.
- Client A creates channel while Client B sends a bot message in another channel.
- Sync both clients and assert converged state.
- Restart relay and assert documents reload from storage.

### Keyhive spike tests

- Identity generation and archive round-trip. The upstream E2E tests already cover archive serialization and ingestion patterns (`vendor/keyhive/keyhive_wasm/e2e/keyhive.spec.ts:119-160`, `:196-277`).
- Membership add/revoke behavior.
- Event export/ingest behavior.
- Encryption/decryption of serialized Automerge bytes.

### Manual validation commands

```bash
cd ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/scripts
npm run smoke:chat-model
```

Expected output includes both channels and both members after merge.

## Risks, Alternatives, and Open Questions

### Risks

- **Keyhive maturity risk:** The repository explicitly says pre-alpha, unstable APIs, and no security audit (`vendor/keyhive/README.md:15-18`). Treat any Keyhive implementation as a research prototype.
- **Large document risk:** A single workspace document with all messages will eventually become too hot and too large. Mitigate by moving busy channels to separate documents early.
- **Authorization/UI mismatch risk:** Users may see role state in Automerge that does not match cryptographic membership state. Treat Keyhive as source of truth for real access and derive UI role displays from synced membership where possible.
- **Bot duplication risk:** CRDT sync and worker restarts can re-trigger bot logic. Use deterministic `botRunId = hash(channelId, triggeringMessageId, botId)` and check existing runs before responding.
- **Metadata privacy risk:** Even with encrypted content, document IDs, heads, timing, and membership graph metadata may leak. Beelay explicitly discusses metadata/sync tension (`sources/web/08-keyhive-notebook.md:137-139`).

### Alternatives considered

1. **Traditional SQL chat server plus Automerge for drafts only.** This is simpler but fails the local-first goal. The server remains the authority for message order and availability.
2. **One Automerge document per message.** This maximizes access granularity but creates too many documents and makes channel rendering expensive.
3. **One giant Automerge document for everything forever.** This is easiest for a demo but poor for sync selectivity and private channels.
4. **Custom ACL fields inside Automerge only.** This is useful for display and moderation state but cannot provide E2EE or decentralized delegation/revocation.
5. **Wait for production Keyhive.** This avoids pre-alpha churn but prevents learning. The recommended compromise is a stable adapter interface with mock and experimental real implementations.

### Open questions

- Which runtime should host `keyhive_wasm` first: browser, Node, or both?
- How should Keyhive `Access` values map exactly to `read/comment/edit/admin`?
- Can `automerge-repo` `sharePolicy` receive enough peer identity context to enforce Keyhive-aware sharing, or do we need a Beelay-specific transport?
- What is the right split threshold for per-channel documents: message count, byte size, or activity rate?
- How should attachment blobs be encrypted, stored, and garbage-collected?

## Intern Onboarding Checklist

Read these in order:

1. `sources/web/01-automerge-concepts.md` for documents, repositories, handles, URLs, sync protocol, and storage format.
2. `sources/web/06-automerge-repositories.md` for `Repo`, `StorageAdapter`, `NetworkAdapter`, and `DocHandle.change`.
3. `sources/web/04-automerge-networking.md` for WebSocket server/client adapter setup.
4. `vendor/automerge-repo-sync-server/src/server.js` for a minimal real sync server.
5. `vendor/keyhive/README.md` for package maturity and warnings.
6. `sources/web/08-keyhive-notebook.md`, especially the Beelay section around authentication and sync order.
7. `vendor/keyhive/keyhive_wasm/src/js/keyhive.rs` for actual exported WASM API names.
8. `scripts/automerge-chat-model-smoke.mjs` for the smallest runnable CRDT chat model.

Then implement Phase 1 tests before touching server code. A local-first system is easiest to debug when the pure data model is already proven.

## References

- Automerge concepts: `sources/web/01-automerge-concepts.md`.
- Automerge repositories: `sources/web/06-automerge-repositories.md`.
- Automerge networking: `sources/web/04-automerge-networking.md`.
- Automerge sync server source: `vendor/automerge-repo-sync-server/src/server.js`.
- Keyhive notebook: `sources/web/08-keyhive-notebook.md`.
- Keyhive README: `vendor/keyhive/README.md`.
- Keyhive WASM API: `vendor/keyhive/keyhive_wasm/src/js/keyhive.rs`.
- Smoke experiment: `scripts/automerge-chat-model-smoke.mjs`.
