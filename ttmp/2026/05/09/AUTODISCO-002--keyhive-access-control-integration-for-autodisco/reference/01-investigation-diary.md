---
Title: Investigation Diary
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
RelatedFiles:
    - Path: packages/chat-acl/src/index.ts
      Note: |-
        Current ACL adapter seam investigated for Keyhive integration planning.
        ACL adapter evidence recorded in diary
    - Path: packages/chat-core/src/types.ts
      Note: Current WorkspaceDoc schema includes optional Keyhive refs.
    - Path: packages/chat-server/src/http/bootstrap.ts
      Note: Current bootstrap and placeholder invitation endpoint reviewed.
    - Path: packages/chat-server/src/repo.ts
      Note: Current Automerge relay sharePolicy reviewed.
    - Path: packages/chat-web/src/pages/HomePage/HomePage.tsx
      Note: Current browser create/open/log/join-link flow reviewed.
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/design-doc/01-keyhive-access-control-integration-design-guide.md
      Note: |-
        Primary design deliverable produced from this diary.
        Primary design produced by this investigation
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/sources/01-source-list.md
      Note: Source inventory for this ticket.
ExternalSources:
    - https://www.inkandswitch.com/keyhive/notebook/
    - https://github.com/inkandswitch/keyhive
Summary: Chronological investigation diary for the AUTODISCO Keyhive access-control integration design ticket.
LastUpdated: 2026-05-09T14:35:00-04:00
WhatFor: Use this to understand how the Keyhive integration design guide was produced, what evidence was inspected, and what remains to validate.
WhenToUse: When continuing AUTODISCO-002, reviewing the design guide, or implementing the first Keyhive/ACL work.
---



# Diary

## Goal

This diary records the creation of the AUTODISCO-002 Keyhive integration ticket, the evidence gathered from the current AUTODISCO codebase and captured Keyhive sources, and the design decisions captured in the implementation guide. It is intended to let another engineer continue the Keyhive work without re-running the entire investigation.

## Step 1: Create the Keyhive integration ticket workspace

I created a new docmgr ticket dedicated to Keyhive work so that access-control planning does not get buried inside the broader AUTODISCO-001 prototype ticket. The new ticket has a design document, this diary, task/changelog files, and a sources area for copied Keyhive notes and local evidence.

### Prompt Context

**User prompt (verbatim):** "Ok, now let's work on keyhive, how would you build and what?"

**Follow-up user prompt (verbatim):** "ok, create a new docmgr ticket for keyhive work, and since i'm new to it, you'll have to be very detailed and cover a lot of stuff in the design guide.

Create  a detailed analysis / design / implementation guide that is for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file references. It should be very clear and technical. Store in the ticket and the nupload to remarkable.

Keep a diary as you work."

**Continuation prompt (verbatim):** "continue"

**Assistant interpretation:** Create a new docmgr ticket for the Keyhive access-control work, produce a detailed intern-oriented design/implementation guide, keep a chronological diary, and upload the result to reMarkable.

**Inferred user intent:** The user wants to understand Keyhive from first principles and have a concrete, actionable plan for integrating it into the existing AUTODISCO Automerge chat prototype.

### What I did

- Ran `docmgr status --summary-only` to inspect the existing docmgr state.
- Created ticket `AUTODISCO-002` with title `Keyhive Access Control Integration for AUTODISCO`.
- Added a design doc titled `Keyhive Access Control Integration Design Guide`.
- Added a reference doc titled `Investigation Diary`.
- Listed the generated files to confirm the ticket workspace existed.

### Why

The Keyhive work deserves a separate ticket because it is a complex research and implementation track spanning identity, invitations, membership events, access checks, encryption, and future sync transport changes. Keeping it separate from AUTODISCO-001 makes the design easier to review and gives future implementation commits a focused place to update tasks and diary entries.

### What worked

The following command created the ticket and initial documents successfully:

```bash
docmgr ticket create-ticket --ticket AUTODISCO-002 --title "Keyhive Access Control Integration for AUTODISCO" --topics keyhive,access-control,automerge,local-first,invitation,e2ee
docmgr doc add --ticket AUTODISCO-002 --doc-type design-doc --title "Keyhive Access Control Integration Design Guide"
docmgr doc add --ticket AUTODISCO-002 --doc-type reference --title "Investigation Diary"
find ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco -maxdepth 3 -type f | sort
```

### What didn't work

No blocking failures occurred during ticket creation.

### What I learned

The repository already had one AUTODISCO ticket, so this new ticket became the second ticket in the docmgr root. The generated ticket path is:

```text
ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco
```

### What was tricky to build

The only subtlety was selecting the right scope. The request is not merely “add Keyhive,” because the user is new to the technology and needs a detailed implementation guide. I therefore treated this as a design/research deliverable, not a code-only task.

### What warrants a second pair of eyes

Review whether `AUTODISCO-002` is the desired ticket id/title before implementation commits start referencing it.

### What should be done in the future

Keep all Keyhive spike results, API notes, and implementation diary entries in this ticket so AUTODISCO-001 can remain the broader prototype history.

### Code review instructions

- Start with `ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/index.md`.
- Confirm the design doc and diary exist under `design-doc/` and `reference/`.

### Technical details

Primary generated files:

- `ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/design-doc/01-keyhive-access-control-integration-design-guide.md`
- `ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/reference/01-investigation-diary.md`
- `ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/tasks.md`
- `ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/changelog.md`

## Step 2: Gather current-code and Keyhive evidence

I gathered evidence from both sides of the integration boundary: the current AUTODISCO codebase and the captured Keyhive/Beelay sources. The goal was to make the design guide file-backed rather than speculative.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Inspect existing AUTODISCO code and Keyhive source material before writing recommendations.

**Inferred user intent:** The user wants a guide that can onboard a new intern and cite exact files/APIs they will implement against.

### What I did

- Copied the captured Keyhive notebook into the new ticket at `sources/web/keyhive-notebook.md`.
- Copied the Keyhive WASM JS binding surface into `vendor-notes/keyhive_wasm_js_api.rs`.
- Copied Keyhive WASM package metadata and upstream e2e examples into `vendor-notes/`.
- Created `sources/01-source-list.md` documenting all evidence files.
- Inspected current AUTODISCO files with line-numbered `nl -ba` output:
  - `packages/chat-acl/src/index.ts`
  - `packages/chat-core/src/types.ts`
  - `packages/chat-server/src/http/bootstrap.ts`
  - `packages/chat-server/src/repo.ts`
  - `packages/chat-web/src/pages/HomePage/HomePage.tsx`
  - `packages/chat-web/src/features/automerge/repo.ts`
  - `packages/chat-web/src/features/bootstrap/bootstrapApi.ts`
- Inspected Keyhive/Beelay material:
  - notebook sections on groups, pull control, pre-alpha warning, Beelay sync order, signed envelopes, membership sync, and document sync;
  - WASM binding methods for init, identity, group/document creation, encrypt/decrypt, add/revoke, contact cards, event export, and member capabilities;
  - upstream Playwright tests showing practical JS usage.

### Why

A Keyhive integration plan needs two kinds of evidence. First, it needs to know where AUTODISCO already has extension points. Second, it needs to know what Keyhive actually exposes today, not what we wish it exposed. The design guide uses those concrete anchors to recommend an incremental plan.

### What worked

The current code already has a strong access-control seam:

- `AccessControlAdapter` exists in `packages/chat-acl/src/index.ts`.
- `WorkspaceDoc` already has optional `KeyhiveRefs` in `packages/chat-core/src/types.ts`.
- The web bootstrap response type already includes optional `keyhive` fields in `packages/chat-web/src/features/bootstrap/bootstrapApi.ts`.

The captured Keyhive WASM API surface was enough to plan an experimental adapter and spike.

### What didn't work

An attempted copy of `vendor/keyhive/README.md` failed because that file was not present at the expected path in the current ticket vendor copy:

```text
cp: cannot stat 'ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/vendor/keyhive/README.md': No such file or directory
```

This did not block the work because the Keyhive notebook and WASM source files contained the necessary evidence, and the current vendor tree did include package metadata and WASM source/tests.

### What I learned

The current app is more ready for Keyhive than expected: the web bootstrap type already reserves a `keyhive` response object, and the core schema already has `WorkspaceDoc.keyhive`. The best first implementation step is therefore not a huge Keyhive spike; it is wiring the existing mock ACL adapter into the real workspace bootstrap path.

### What was tricky to build

The Keyhive concept set is broad: groups, documents, relay/pull/read/edit/admin access, contact cards, signed envelopes, membership graph sync, document collection sync, encrypted content, and archives. The tricky part was separating immediate product-shaped work from long-term encrypted sync work. The design guide resolves this by staging mock ACL metadata and invitation UX before real Keyhive WASM and Beelay work.

### What warrants a second pair of eyes

A reviewer should check the proposed access-level mapping, especially `comment -> edit`, because AUTODISCO has a more fine-grained chat permission than Keyhive's current visible access enum.

### What should be done in the future

Run an actual `@keyhive/keyhive` install/link spike and record whether Node, browser/Vite, or both environments work.

### Code review instructions

- Review `sources/01-source-list.md` for the evidence inventory.
- Review the design doc references section to confirm the cited files and line ranges are sufficient.
- Review the copied `vendor-notes/keyhive_wasm-e2e-keyhive.spec.ts` for practical upstream API examples.

### Technical details

Representative commands:

```bash
cp ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/sources/web/08-keyhive-notebook.md "$T/sources/web/keyhive-notebook.md"
cp ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/vendor/keyhive/keyhive_wasm/src/js/keyhive.rs "$T/vendor-notes/keyhive_wasm_js_api.rs"
cp ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/vendor/keyhive/keyhive_wasm/package.json "$T/vendor-notes/keyhive_wasm-package.json"
cp ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/vendor/keyhive/keyhive_wasm/e2e/keyhive.spec.ts "$T/vendor-notes/keyhive_wasm-e2e-keyhive.spec.ts"
cp ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/vendor/keyhive/keyhive_wasm/e2e/document.spec.ts "$T/vendor-notes/keyhive_wasm-e2e-document.spec.ts"
nl -ba packages/chat-acl/src/index.ts | sed -n '1,140p'
nl -ba packages/chat-server/src/http/bootstrap.ts | sed -n '1,90p'
nl -ba packages/chat-server/src/repo.ts | sed -n '1,70p'
nl -ba packages/chat-web/src/pages/HomePage/HomePage.tsx | sed -n '1,230p'
```

## Step 3: Write the Keyhive integration design guide

I wrote the primary design guide as an intern-oriented implementation plan. It explains how Automerge and Keyhive differ, why the current AUTODISCO prototype is collaborative but not access-controlled, and how to add Keyhive concepts without destabilizing the working Automerge sync path.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Produce a detailed, clear, technical design/implementation guide with prose, bullets, pseudocode, diagrams, API references, and file references.

**Inferred user intent:** The user needs a practical onboarding document that teaches enough Keyhive context to let a new intern implement the integration safely.

### What I did

- Replaced the generated design-doc template with a detailed guide.
- Covered:
  - executive summary;
  - problem statement and scope;
  - current-state architecture and evidence;
  - Automerge vs Keyhive conceptual model;
  - principal/access mapping;
  - proposed phased architecture;
  - API sketches for bootstrap, contact card receive, invite, revoke, and event ingest;
  - UI design for identity card and invite form;
  - implementation phases K1-K7;
  - testing strategy;
  - risks, alternatives, and open questions;
  - recommended first PR;
  - references with file/line anchors.
- Made the key recommendation that the first implementation should wire mock ACL metadata into workspace bootstrap before attempting real Keyhive WASM.

### Why

The user explicitly said they are new to Keyhive. The design therefore needed to explain not just what to code, but why Keyhive is a separate authorization/membership/encryption layer rather than just a role field inside Automerge.

### What worked

The current codebase offered natural integration points:

- `AccessControlAdapter` already exists.
- `WorkspaceDoc.keyhive` already exists.
- The web bootstrap response already has optional `keyhive` fields.
- The web UI already has local identity, join links, reset tools, and debug logs that can be extended with Keyhive status.

### What didn't work

No writing blockers occurred. The main limitation is that the guide is design-only so far; no Keyhive code was added in this step.

### What I learned

The safest path is to keep `mock` as the stable default and introduce `keyhive-experimental` only after a focused WASM spike proves the runtime and API story. This avoids mixing unstable cryptographic library integration with the already-working Automerge chat prototype.

### What was tricky to build

The guide had to preserve two truths at the same time: Keyhive is the right conceptual direction for decentralized access control, but the current code is pre-alpha and unaudited. The implementation plan therefore distinguishes product semantics, app-layer enforcement, experimental Keyhive backing, and eventual encrypted transport.

### What warrants a second pair of eyes

- Validate the proposed access mapping table.
- Validate the recommendation to defer Beelay until after Keyhive identity/member/event primitives work.
- Review whether the first PR should inject the ACL adapter into `createChatServer` or keep it scoped to the bootstrap router initially.

### What should be done in the future

Implement the recommended first PR: wire mock ACL metadata into workspace bootstrap and return/store `keyhive` refs.

### Code review instructions

- Start with the design doc executive summary and recommended first pull request.
- Then review the API design and implementation phases.
- Finally inspect the risks/open questions to decide what should be validated before coding real Keyhive mode.

### Technical details

Primary document:

```text
ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/design-doc/01-keyhive-access-control-integration-design-guide.md
```

## Step 4: Validate ticket metadata and fix docmgr issues

After writing the first version of the ticket documents, I ran docmgr doctor and fixed the metadata issues it reported. This made the ticket ready for upload and future searching.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Validate the ticket deliverables and resolve docmgr metadata problems before publishing to reMarkable.

**Inferred user intent:** The user wants the Keyhive guide stored as a clean, structured ticket deliverable rather than an ad-hoc Markdown file.

### What I did

- Related key repository files to the design guide and diary with `docmgr doc relate`.
- Ran `docmgr doctor --ticket AUTODISCO-002 --stale-after 30`.
- Added missing vocabulary topics: `e2ee`, `invitation`, and `local-first`.
- Renamed `sources/source-list.md` to `sources/01-source-list.md` to satisfy numeric-prefix expectations.
- Added frontmatter to the source list.
- Updated references from `sources/source-list.md` to `sources/01-source-list.md`.
- Reran doctor successfully.

### Why

The doctor output caught issues that would make the ticket less searchable and less consistent with docmgr conventions. Fixing them now prevents future readers from seeing stale or invalid metadata.

### What worked

The final doctor run passed:

```text
## Doctor Report (1 findings)

### AUTODISCO-002

- ✅ All checks passed
```

### What didn't work

The first doctor run reported unknown vocabulary and a source-list frontmatter error:

```text
[WARNING] unknown_topics — unknown topics: [e2ee invitation local-first]
[ERROR] invalid_frontmatter — Failed to parse frontmatter: .../sources/source-list.md frontmatter delimiters '---' not found
[WARNING] missing_numeric_prefix — file without numeric prefix (.../sources/source-list.md)
```

### What I learned

`docmgr doctor` validates files under `sources/` too, so even supporting source inventories need docmgr-style frontmatter if they are Markdown files inside the ticket.

### What was tricky to build

The source list started as a plain inventory file, but docmgr treats it as a managed Markdown document. Renaming it and adding frontmatter made it consistent with the rest of the ticket.

### What warrants a second pair of eyes

Review the vocabulary descriptions for `e2ee`, `invitation`, and `local-first` to ensure they match the repository's preferred taxonomy.

### What should be done in the future

Use numbered Markdown filenames and frontmatter for any additional source notes added to this ticket.

### Code review instructions

- Run `docmgr doctor --ticket AUTODISCO-002 --stale-after 30`.
- Inspect `ttmp/vocabulary.yaml` for the new topic entries.
- Inspect `sources/01-source-list.md` frontmatter.

### Technical details

Commands run:

```bash
docmgr doc relate --doc <design-doc> --file-note "/abs/path:reason"
docmgr doctor --ticket AUTODISCO-002 --stale-after 30
docmgr vocab add --category topics --slug e2ee --description "End-to-end encryption and related encrypted sync or storage work."
docmgr vocab add --category topics --slug invitation --description "Invitation, join, contact-card, and member onboarding flows."
docmgr vocab add --category topics --slug local-first --description "Local-first software, offline-capable sync, and peer-owned state."
docmgr doctor --ticket AUTODISCO-002 --stale-after 30
```

## Step 5: Upload the Keyhive guide bundle to reMarkable

After docmgr validation passed, I uploaded the Keyhive ticket bundle to reMarkable as a single PDF with a table of contents. The bundle includes the ticket index, design guide, diary, tasks, changelog, and source list.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Deliver the completed ticket documentation to reMarkable for reading/review.

**Inferred user intent:** The user wants the detailed Keyhive integration guide available on their reMarkable device, not only in the repository.

### What I did

- Ran a dry-run bundle upload with `remarquee upload bundle --dry-run`.
- Ran the real bundle upload to `/ai/2026/05/09/AUTODISCO-002`.
- Included six Markdown files in the bundle:
  - `index.md`
  - `design-doc/01-keyhive-access-control-integration-design-guide.md`
  - `reference/01-investigation-diary.md`
  - `tasks.md`
  - `changelog.md`
  - `sources/01-source-list.md`

### Why

The user explicitly requested upload to reMarkable. Bundling the files into one PDF keeps the design guide, diary, and checklist together.

### What worked

The dry-run listed the expected bundle inputs and destination. The real upload succeeded with:

```text
OK: uploaded AUTODISCO-002_Keyhive_Access_Control_Guide.pdf -> /ai/2026/05/09/AUTODISCO-002
```

### What didn't work

No upload failure occurred.

### What I learned

The bundle upload path is concise and enough for successful delivery; no separate cloud listing was necessary after the `OK: uploaded` response.

### What was tricky to build

N/A. The only choice was which files to include. I included the core ticket navigation and deliverables, not the copied vendor source excerpts, to keep the PDF readable.

### What warrants a second pair of eyes

Confirm whether future uploads should include the copied `vendor-notes/` source excerpts as appendices or keep them repository-only.

### What should be done in the future

If the design guide changes materially during implementation, upload a refreshed bundle with `--force` or a new name/date.

### Code review instructions

- Confirm the upload command output contains `OK: uploaded`.
- Read the design guide on reMarkable under `/ai/2026/05/09/AUTODISCO-002`.

### Technical details

Commands run:

```bash
remarquee upload bundle --dry-run <ticket docs...> \
  --name "AUTODISCO-002 Keyhive Access Control Guide" \
  --remote-dir "/ai/2026/05/09/AUTODISCO-002" \
  --toc-depth 2 \
  --non-interactive

remarquee upload bundle <ticket docs...> \
  --name "AUTODISCO-002 Keyhive Access Control Guide" \
  --remote-dir "/ai/2026/05/09/AUTODISCO-002" \
  --toc-depth 2 \
  --non-interactive
```
