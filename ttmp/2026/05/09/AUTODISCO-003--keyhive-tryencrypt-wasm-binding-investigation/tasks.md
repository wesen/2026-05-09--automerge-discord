# Tasks

## TODO

- [x] Create AUTODISCO-003 ticket workspace.
- [x] Clone upstream Keyhive source under repo-root `vendor/keyhive-src` for local inspection.
- [x] Preserve source clone commit and package metadata as artifacts.
- [x] Create scripts for direct `tryEncrypt` reproduction.
- [x] Create matrix experiments for `tryEncrypt`/`tryEncryptArchive`, `expandPrekeys`, group/no-group docs, content-ref sizes, and predecessor refs.
- [x] Isolate a workaround using `doc.__wasm_refgen_toJsDocument()`.
- [x] Translate the Rust wasm-bindgen test shape into JS and compare direct doc, doc-ref, and archive calls.
- [x] Capture generated JS wrapper snippets for `tryEncrypt` and `generateDocument`.
- [x] Write upstream-ready bug report with environment, repro, actual behavior, expected behavior, experiments, source analysis, and workaround.
- [x] Run `docmgr doctor` for AUTODISCO-003.

## Follow-up

- [ ] Run the minimal repro against a browser/bundler target if upstream asks for non-Node confirmation.
- [ ] File the upstream issue with `reports/01-keyhive-tryencrypt-bug-report.md`.
- [ ] If upstream confirms the workaround is intended, update AUTODISCO-002 to use `doc.__wasm_refgen_toJsDocument()` or `tryEncryptArchive` explicitly in future E2EE work.
