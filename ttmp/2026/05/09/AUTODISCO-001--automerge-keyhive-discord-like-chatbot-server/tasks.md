# Tasks

## Completed

- [x] Create docmgr ticket workspace for AUTODISCO-001.
- [x] Add primary design guide and investigation diary documents.
- [x] Gather Automerge and Keyhive web sources as local Markdown files under `sources/web/`.
- [x] Clone Automerge Repo, Automerge Repo Sync Server, and Keyhive repositories under `vendor/`.
- [x] Write a runnable Automerge chat-model smoke experiment under `scripts/`.
- [x] Run the smoke experiment and record the API correction in the diary.
- [x] Write the intern-oriented design and implementation guide.
- [x] Upload the documentation bundle to reMarkable.

## Follow-up implementation tasks

- [ ] Scaffold the proposed TypeScript monorepo (`chat-core`, `chat-server`, `chat-client`, `chat-acl`, `chat-bot-worker`).
- [ ] Promote `scripts/automerge-chat-model-smoke.mjs` into a real unit test.
- [ ] Implement the mock `AccessControlAdapter` before integrating Keyhive.
- [ ] Spike `keyhive_wasm` in the intended runtime and verify contact-card, add-member, revoke-member, encrypt/decrypt, and event-ingest flows.
- [ ] Validate whether `automerge-repo` `sharePolicy` has enough peer identity context for Keyhive-aware sharing.
