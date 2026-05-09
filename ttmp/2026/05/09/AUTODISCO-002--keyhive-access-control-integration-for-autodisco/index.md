---
Title: Keyhive Access Control Integration for AUTODISCO
Ticket: AUTODISCO-002
Status: active
Topics:
    - keyhive
    - access-control
    - automerge
    - local-first
    - invitation
    - e2ee
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/design-doc/01-keyhive-access-control-integration-design-guide.md
      Note: Primary implementation guide for the Keyhive access-control work.
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/reference/01-investigation-diary.md
      Note: Chronological investigation diary.
    - Path: ttmp/2026/05/09/AUTODISCO-002--keyhive-access-control-integration-for-autodisco/sources/01-source-list.md
      Note: Evidence inventory for the ticket.
ExternalSources:
    - https://www.inkandswitch.com/keyhive/notebook/
    - https://github.com/inkandswitch/keyhive
Summary: Ticket for designing and implementing Keyhive-style identity, invitations, access-control metadata, experimental Keyhive WASM integration, and eventual encrypted sync paths in AUTODISCO.
LastUpdated: 2026-05-09T14:20:00-04:00
WhatFor: Use this ticket as the home for Keyhive access-control planning and implementation follow-up work.
WhenToUse: When adding ACL metadata, identity/contact-card UI, invitation APIs, Keyhive WASM spikes, or Beelay/E2EE research.
---

# Keyhive Access Control Integration for AUTODISCO

## Overview

This ticket tracks the Keyhive access-control integration work for AUTODISCO. AUTODISCO already has real Automerge collaboration: browser peers open shared workspace documents, send messages through `DocHandle.change`, sync through the relay, persist across relay restart, and merge offline edits after reconnect. The missing major subsystem is access control.

The primary deliverable in this ticket is an intern-oriented design and implementation guide for adding Keyhive-style identity, invitation, membership, and eventual encrypted sync to the existing Automerge chat prototype.

## Key Links

- [Design guide](./design-doc/01-keyhive-access-control-integration-design-guide.md)
- [Investigation diary](./reference/01-investigation-diary.md)
- [Source list](./sources/01-source-list.md)
- [Tasks](./tasks.md)
- [Changelog](./changelog.md)

## Status

Current status: **active**.

Documentation/design work is complete for the first pass. The recommended first implementation PR is:

> Wire mock ACL metadata into workspace bootstrap.

That means: call the existing `AccessControlAdapter` during workspace creation, store `WorkspaceDoc.keyhive` refs, return those refs in the bootstrap response, update tests, and display them in the UI/debug pane.

## Topics

- keyhive
- access-control
- automerge
- local-first
- invitation
- e2ee

## Structure

- `design-doc/` — primary design and implementation guide.
- `reference/` — investigation diary.
- `sources/` — source inventory and captured web references.
- `vendor-notes/` — copied Keyhive WASM source/API excerpts used for planning.
- `scripts/` — future spike scripts/tests.
