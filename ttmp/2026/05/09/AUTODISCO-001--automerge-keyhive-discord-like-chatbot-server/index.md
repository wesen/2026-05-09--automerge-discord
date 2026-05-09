---
Title: Automerge Keyhive Discord-like Chatbot Server
Ticket: AUTODISCO-001
Status: active
Topics:
    - automerge
    - keyhive
    - crdt
    - discord
    - chatbot
    - access-control
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/design-doc/01-automerge-keyhive-discord-like-chatbot-server-design-guide.md
      Note: Primary intern-oriented design and implementation guide
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/reference/01-investigation-diary.md
      Note: Chronological investigation diary
    - Path: ttmp/2026/05/09/AUTODISCO-001--automerge-keyhive-discord-like-chatbot-server/scripts/automerge-chat-model-smoke.mjs
      Note: Runnable Automerge CRDT chat-model smoke experiment
ExternalSources:
    - https://automerge.org/docs/reference/concepts/
    - https://automerge.org/docs/reference/repositories/
    - https://automerge.org/docs/reference/repositories/networking/
    - https://www.inkandswitch.com/keyhive/notebook/
    - https://github.com/inkandswitch/keyhive
Summary: Research ticket and implementation guide for a Discord-like chatbot server using Automerge CRDT sync and Keyhive-style access control.
LastUpdated: 2026-05-09T12:52:00-04:00
WhatFor: Use as the entry point for research, design, source captures, and implementation follow-ups.
WhenToUse: When onboarding an intern or starting implementation of the Automerge + Keyhive chatbot server prototype.
---


# Automerge Keyhive Discord-like Chatbot Server

## Overview

This ticket contains the research and design package for a Discord-like chatbot server based on Automerge CRDT collaboration and Keyhive-style local-first access control. The main deliverable is an intern-oriented design and implementation guide that explains the system model, data schemas, access-control mapping, APIs, flows, implementation phases, tests, and risks.

## Key Links

- [Design guide](./design-doc/01-automerge-keyhive-discord-like-chatbot-server-design-guide.md)
- [Investigation diary](./reference/01-investigation-diary.md)
- [Task list](./tasks.md)
- [Changelog](./changelog.md)
- [Source list](./sources/source-list.md)
- [Automerge chat model smoke experiment](./scripts/automerge-chat-model-smoke.mjs)

## Status

Current status: **active**. Research and design are complete; implementation follow-up tasks remain.

## Topics

- automerge
- keyhive
- crdt
- discord
- chatbot
- access-control

## Structure

- `design-doc/` - Architecture and design documents.
- `reference/` - Investigation diary and reusable references.
- `sources/` - Captured web documentation and source list.
- `vendor/` - Cloned upstream repositories used for evidence.
- `scripts/` - Temporary experiments and validation scripts.
- `playbooks/`, `various/`, `archive/` - Reserved for future ticket material.
