# Changelog

## 2026-05-09

- Initial workspace created


## 2026-05-09

Investigated and locally fixed the Keyhive `tryEncrypt` WASM binding bug. Cloned upstream Keyhive source, reproduced the published-package failure, isolated a document ownership/ref workaround, patched `keyhive_wasm/src/js/keyhive.rs` to borrow `&JsDocument` and `&JsChangeId`, compile-checked with Rust 1.90, rebuilt a patched Node WASM package with `wasm-pack`, and verified that direct `kh.tryEncrypt(doc, ...)` now encrypts/decrypts successfully.

### Related Files

- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-003--keyhive-tryencrypt-wasm-binding-investigation/patches/01-tryencrypt-borrow-document.patch — minimal Rust binding patch
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-003--keyhive-tryencrypt-wasm-binding-investigation/design/01-keyhive-tryencrypt-rust-fix-implementation-guide.md — intern-facing implementation guide
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-003--keyhive-tryencrypt-wasm-binding-investigation/scripts/09-keyhive-tryencrypt-patched-local-repro.mjs — patched local verification script
- /home/manuel/code/wesen/2026-05-09--automerge-discord/ttmp/2026/05/09/AUTODISCO-003--keyhive-tryencrypt-wasm-binding-investigation/artifacts/15-keyhive-tryencrypt-patched-local-repro.stdout.log — successful patched output

Uploaded the implementation guide to reMarkable at `/ai/2026/05/09/AUTODISCO-003/AUTODISCO-003_Keyhive_tryEncrypt_Rust_Fix_Guide.pdf`.

## 2026-05-09

Updated the upstream bug report with the local Rust fix, compile/build verification, and patched-package repro result. Uploaded the updated report to reMarkable at `/ai/2026/05/09/AUTODISCO-003/AUTODISCO-003_Keyhive_tryEncrypt_Bug_Report_With_Fix.pdf`.

## 2026-05-09

Moved the upstream Keyhive source clone out of the ticket workspace and into repo-root `vendor/keyhive-src`, updated the implementation guide and repro script paths, and re-uploaded the updated implementation guide to reMarkable at `/ai/2026/05/09/AUTODISCO-003/AUTODISCO-003_Keyhive_tryEncrypt_Rust_Fix_Guide_Updated.pdf`.
