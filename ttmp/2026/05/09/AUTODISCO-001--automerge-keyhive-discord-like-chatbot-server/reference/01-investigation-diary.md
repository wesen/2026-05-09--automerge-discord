---
Title: Investigation Diary
Ticket: AUTODISCO-001
Status: active
Topics:
    - automerge
    - keyhive
    - crdt
    - discord
    - chatbot
    - access-control
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/design-doc/01-automerge-keyhive-discord-like-chatbot-server-design-guide.md
      Note: Primary deliverable documented by the diary
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/scripts/automerge-chat-model-smoke.mjs
      Note: Experiment whose result and failure were recorded
ExternalSources: []
Summary: Chronological diary for the Automerge + Keyhive Discord-like chatbot server research ticket.
LastUpdated: 2026-05-09T12:48:00-04:00
WhatFor: Use to understand what was researched, what commands were run, and what validation was performed.
WhenToUse: When continuing the ticket or reviewing evidence behind the design guide.
---


# Diary

## Goal

This diary records the research and documentation work for designing a Discord-like chatbot server based on Automerge CRDT synchronization and Keyhive access control. It captures ticket setup, source gathering, repository inspection, the modeling experiment, and delivery steps so another engineer can continue without reconstructing the investigation.

## Step 1: Create the docmgr ticket workspace

I created a new docmgr ticket workspace for the request and added the primary design guide plus this investigation diary. This established a stable place for source material, cloned repositories, experiments, and final documentation.

### Prompt Context

**User prompt (verbatim):** "Create a docmgr ticket to create a discord-like chatbot server based on automerge and keyhive (CRDT collaborative + access control)

You can use web search and assistant questions using `surf kagi search --query ...` and `surf kagi assistant --help` and `surf chatgpt --help`. 

Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable.

Keep a diary as you work. You can also write experiments in the scripts/ folder of the ticket to help you better understand and validate the technology.

Store all important documents you find as .md (using defuddle if on the web) in the ticket too. You are also welcome to clone repositories under vendor/"

**Assistant interpretation:** Create a docmgr research ticket, gather Automerge and Keyhive evidence, write an intern-oriented design/implementation guide, keep a diary, add experiments, and upload the final bundle to reMarkable.

**Inferred user intent:** The user wants a durable, structured technical plan that can onboard a new intern and become the starting point for building a local-first Discord-like chatbot system.

### What I did

- Ran `docmgr status --summary-only` to confirm the repository had an empty docmgr root.
- Created ticket `AUTODISCO-001` with title `Automerge Keyhive Discord-like Chatbot Server`.
- Added a design document titled `Automerge Keyhive Discord-like Chatbot Server Design Guide`.
- Added a reference document titled `Investigation Diary`.

### Why

The ticket gives the work a stable identity and directory layout. The separate design guide and diary keep final recommendations separate from chronological investigation notes.

### What worked

- `docmgr ticket create-ticket` created the expected `ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server` workspace.
- `docmgr doc add` created the design and diary documents with frontmatter.

### What didn't work

N/A.

### What I learned

The repository already had docmgr configured under `ttmp`, but no tickets existed before this task.

### What was tricky to build

N/A for this step. The work was setup-oriented.

### What warrants a second pair of eyes

N/A.

### What should be done in the future

Keep all generated research artifacts inside this ticket so future implementation work has one place to start.

### Code review instructions

- Start at `ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/index.md`.
- Confirm `design-doc/01-automerge-keyhive-discord-like-chatbot-server-design-guide.md` and `reference/01-investigation-diary.md` exist.

### Technical details

Commands run:

```bash
docmgr status --summary-only
docmgr ticket create-ticket --ticket AUTODISCO-001 --title "Automerge Keyhive Discord-like Chatbot Server" --topics automerge,keyhive,crdt,discord,chatbot,access-control
docmgr doc add --ticket AUTODISCO-001 --doc-type design-doc --title "Automerge Keyhive Discord-like Chatbot Server Design Guide"
docmgr doc add --ticket AUTODISCO-001 --doc-type reference --title "Investigation Diary"
find ttmp -maxdepth 4 -type f | sort
```

## Step 2: Gather web sources and clone upstream repositories

I searched for Automerge Repo, Automerge sync server, and Keyhive documentation, then saved key web pages as Markdown using Defuddle. I also cloned upstream repositories into `vendor/` so the design guide could cite actual implementation files, not only prose documentation.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Gather primary sources locally and cite them in the design guide.

**Inferred user intent:** The user wants the ticket to remain useful even if web pages change or the next engineer is offline.

### What I did

- Ran Kagi searches for Automerge Repo sync server docs and Keyhive documentation.
- Saved Automerge and Keyhive web pages under `sources/web/` with `defuddle parse --md`.
- Created `sources/source-list.md` listing the primary URLs.
- Cloned:
  - `https://github.com/automerge/automerge-repo.git`
  - `https://github.com/automerge/automerge-repo-sync-server.git`
  - `https://github.com/inkandswitch/keyhive.git`

### Why

The design guide needed evidence-backed claims and concrete API/file references. Cloning source repositories made it possible to cite files such as `vendor/automerge-repo-sync-server/src/server.js` and `vendor/keyhive/keyhive_wasm/src/js/keyhive.rs`.

### What worked

- Defuddle successfully saved all selected web pages as Markdown.
- All three repositories cloned successfully with `--depth 1`.
- `rg` found useful anchors for Automerge repository concepts, sync server setup, Keyhive access APIs, and Beelay sync behavior.

### What didn't work

One `rg` command included a nonexistent path `sources/web/keyhive`, which produced:

```text
rg: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/sources/web/keyhive: No such file or directory (os error 2)
```

This did not block the work because the actual Keyhive web documents were `sources/web/08-keyhive-notebook.md` and `sources/web/07-keyhive-notebook-01.md`.

### What I learned

Automerge’s own docs clearly separate `automerge` as the CRDT/sync/storage-format implementation from `automerge-repo` as application plumbing. Keyhive is the right conceptual match for access control, but its README explicitly warns that the current release is pre-alpha and unaudited.

### What was tricky to build

The Keyhive documentation and repository expose several related concepts: Keyhive, BeeKEM, Beelay, membership graph sync, encrypted content, and events. The tricky part was separating what should be part of the first implementation from what should remain a future E2EE/Beelay phase. The design guide resolves this by defining an access-control adapter with both mock and experimental real implementations.

### What warrants a second pair of eyes

A security-focused reviewer should verify that the design guide does not overstate Keyhive readiness. The guide intentionally marks Keyhive production security as out of scope for the first prototype.

### What should be done in the future

If implementation begins, pin exact dependency versions and record upstream commit hashes for the cloned repositories.

### Code review instructions

- Review `sources/source-list.md` for the source set.
- Review `sources/web/*.md` for captured web docs.
- Review `vendor/keyhive/README.md` before making any security claims.

### Technical details

Representative commands run:

```bash
surf kagi search --query "Automerge JavaScript repo sync server API storage websocket documentation"
surf kagi search --query "Keyhive Automerge access control CRDT repository documentation"
surf kagi search --query "Automerge Repo @automerge/automerge-repo sync server docs"
defuddle parse https://automerge.org/docs/reference/concepts/ --md -o "$TICKET/sources/web/01-automerge-concepts.md"
defuddle parse https://www.inkandswitch.com/keyhive/notebook/ --md -o "$TICKET/sources/web/08-keyhive-notebook.md"
git clone --depth 1 https://github.com/automerge/automerge-repo.git
git clone --depth 1 https://github.com/automerge/automerge-repo-sync-server.git
git clone --depth 1 https://github.com/inkandswitch/keyhive.git
```

## Step 3: Write and run an Automerge chat model smoke experiment

I added a small runnable experiment in the ticket `scripts/` directory to validate the core data-model assumption: two offline replicas can independently create channels, members, and messages, and Automerge can merge them into one converged document.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Add practical experiments where useful to validate technology assumptions.

**Inferred user intent:** The user wants the design to be grounded in runnable evidence, not just web research.

### What I did

- Created `scripts/automerge-chat-model-smoke.mjs`.
- Created `scripts/package.json` with `@automerge/automerge` dependency.
- Ran `npm install --silent`.
- Ran `npm run smoke:chat-model`.
- Fixed the script after discovering the current `A.merge` API return shape.

### Why

The most basic requirement of the proposed system is concurrent offline edits that merge. A short Automerge-only experiment proves the shape before involving networking, server code, bots, or Keyhive.

### What worked

The final smoke run succeeded and printed:

```json
{
  "channels": [
    "bots",
    "general"
  ],
  "members": [
    "alice",
    "bot"
  ],
  "generalMessages": 1,
  "botMessages": 1
}
```

### What didn't work

The first script version assumed `A.merge(alice, bob)` returned an iterable result:

```text
TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))
    at file:///home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/scripts/automerge-chat-model-smoke.mjs:37:18
```

I fixed this by changing:

```javascript
const [merged] = A.merge(alice, bob)
```

to:

```javascript
const merged = A.merge(alice, bob)
```

### What I learned

The current JavaScript Automerge API returns the merged document directly. The experiment also suggests that maps keyed by stable IDs are a good fit for channels and members, while channel message arrays are acceptable for a prototype but should become per-channel documents for larger rooms.

### What was tricky to build

The main tricky point was avoiding accidental assumptions from older Automerge API examples. The smoke test is intentionally tiny so future API drift is immediately visible.

### What warrants a second pair of eyes

A future implementation reviewer should add conflict-focused tests for concurrent edits to the same message and concurrent reactions on the same emoji.

### What should be done in the future

Promote the smoke experiment into a real Vitest test under the proposed `packages/chat-core` package.

### Code review instructions

- Start with `scripts/automerge-chat-model-smoke.mjs`.
- Validate with:

```bash
cd ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/scripts
npm run smoke:chat-model
```

### Technical details

Files created:

- `scripts/automerge-chat-model-smoke.mjs`
- `scripts/package.json`
- `scripts/package-lock.json`
- `scripts/node_modules/` from `npm install` (implementation artifact; should not be committed in a normal project unless intentionally vendored)

## Step 4: Write the intern-oriented design guide

I wrote the primary design guide as a comprehensive onboarding and implementation document. It explains Automerge concepts, Keyhive concepts, component boundaries, document schemas, access-control mapping, APIs, core flows, implementation phases, testing strategy, risks, and references.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Produce a detailed, clear, technical guide suitable for a new intern.

**Inferred user intent:** The user wants the output to be actionable enough that someone can start building the system from it.

### What I did

- Replaced the generated design-doc template with a full design guide.
- Included diagrams, tables, TypeScript interfaces, pseudocode, flow explanations, implementation phases, and testing plans.
- Cited local web-source and vendor files with line references gathered via `nl -ba`.
- Explicitly called out Keyhive maturity risk.

### Why

The user requested a detailed analysis/design/implementation guide for a new intern. The guide needed to be self-contained and technical enough to explain not only what to build, but why the architecture is shaped around CRDT documents and access-control events.

### What worked

The final design guide includes:

- Executive summary.
- Problem statement and scope.
- Evidence-backed Automerge and Keyhive current-state sections.
- System diagram.
- Data model and per-channel document guidance.
- Access-control mapping from Discord concepts to Keyhive concepts.
- HTTP and client API sketches.
- Core flows for workspace creation, offline merge, bot invite, and bot response.
- Phased implementation plan.
- Testing and validation strategy.
- Risks, alternatives, and open questions.

### What didn't work

N/A.

### What I learned

The cleanest implementation path is to build the Automerge model and relay first, keep an ACL adapter boundary from the beginning, use a mock ACL adapter for early progress, and treat real Keyhive/Beelay integration as a separate spike due to pre-alpha maturity.

### What was tricky to build

The main design challenge was avoiding two extremes: making Keyhive a hand-wavy future add-on, or forcing the first prototype to depend on pre-alpha cryptographic sync. The adapter boundary is the compromise. It lets intern work proceed while keeping the architecture compatible with Keyhive concepts.

### What warrants a second pair of eyes

- The exact mapping from Keyhive `Access` to chat permissions needs a Keyhive/domain expert.
- The `sharePolicy` plan needs validation against actual `automerge-repo` peer identity hooks.
- The bot idempotency strategy should be tested under restart and reconnect scenarios.

### What should be done in the future

Start implementation with Phase 1 data-model tests, not server code.

### Code review instructions

- Read `design-doc/01-automerge-keyhive-discord-like-chatbot-server-design-guide.md` from top to bottom.
- Check cited files exist under `sources/web/`, `vendor/`, and `scripts/`.
- Run the smoke experiment.

### Technical details

Key local references used:

- `sources/web/01-automerge-concepts.md`
- `sources/web/06-automerge-repositories.md`
- `sources/web/04-automerge-networking.md`
- `vendor/automerge-repo-sync-server/src/server.js`
- `vendor/keyhive/README.md`
- `vendor/keyhive/keyhive_wasm/src/js/keyhive.rs`
- `sources/web/08-keyhive-notebook.md`
- `scripts/automerge-chat-model-smoke.mjs`
