---
Title: AUTODISCO-003 Investigation Diary
Ticket: AUTODISCO-003
Status: active
Topics:
  - keyhive
  - wasm
  - rust
  - bug-report
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Chronological investigation diary for the Keyhive tryEncrypt WASM binding bug.
LastUpdated: 2026-05-09T16:02:00-04:00
WhatFor: Use to reconstruct what was tried, what failed, what was fixed, and how the local patch was verified.
WhenToUse: Before resuming AUTODISCO-003 or preparing the upstream issue/PR.
---

# AUTODISCO-003 Investigation Diary

## Step 1: Create ticket and clone Keyhive source

Created ticket `AUTODISCO-003--keyhive-tryencrypt-wasm-binding-investigation` for the `tryEncrypt` bug report and source-level investigation. Cloned upstream Keyhive source into the ticket under repo-root `vendor/keyhive-src` for local inspection.

Clone HEAD was recorded as:

```text
c48c35f093bf60ec8619b4ebf7e469335b4e5ee7
```

The installed npm package was recorded as:

```text
@keyhive/keyhive@0.0.0-alpha.56c
```

## Step 2: Build failing and passing JavaScript reproductions

Created scripts under `scripts/` to reproduce the published-package behavior. The minimal direct call failed:

```bash
node scripts/07-keyhive-tryencrypt-minimal-repro.mjs
```

It exited `1` and threw:

```text
Error: null pointer passed to rust
```

The workaround passed:

```bash
node scripts/08-keyhive-tryencrypt-workaround-repro.mjs
```

It exited `0` and printed:

```text
hello
```

The only important workaround difference was passing `doc.__wasm_refgen_toJsDocument()` into `tryEncrypt`.

## Step 3: Run matrix and source-analysis experiments

Ran a 48-case matrix covering direct `tryEncrypt`, `tryEncryptArchive`, prekey expansion, group/no-group document creation, 3-byte vs 32-byte refs, and predecessor-ref variants. The matrix result was:

```json
{
  "total": 48,
  "pass": 16,
  "fail": 32
}
```

All direct `tryEncrypt(doc, ...)` cases failed. `tryEncryptArchive(doc, ...)` passed for fresh or absent predecessor refs.

Then ran ref/upcast variants. Passing `doc.__wasm_refgen_toJsDocument()` fixed direct `tryEncrypt`; changing only the content ref did not.

## Step 4: Draft upstream-ready bug report

Wrote the upstream-ready bug report at:

```text
reports/01-keyhive-tryencrypt-bug-report.md
```

Uploaded it to reMarkable as:

```text
/ai/2026/05/09/AUTODISCO-003/AUTODISCO-003_Keyhive_tryEncrypt_Bug_Report.pdf
```

## Step 5: Patch Rust binding and compile-check it

Changed `keyhive_wasm/src/js/keyhive.rs` so `try_encrypt` borrows `&JsDocument` and `&JsChangeId`, then passes `doc.inner.dupe()` to Keyhive core. Saved the patch at:

```text
patches/01-tryencrypt-borrow-document.patch
```

The first `cargo check` failed because the default local Rust toolchain was 1.88 and Keyhive requires Rust 1.90. Installed Rust 1.90:

```bash
rustup toolchain install 1.90.0
```

Then verified compile-check:

```bash
cargo +1.90.0 check -p keyhive_wasm
```

Result:

```text
artifacts/12-cargo-check-keyhive-wasm-rust190.exitcode.txt = 0
```

## Step 6: Build patched WASM package and verify the direct JS API

Built a patched Node WASM package with:

```bash
RUSTUP_TOOLCHAIN=1.90.0 npx --yes wasm-pack build --out-dir pkg-node-patched --target nodejs --dev
```

Result:

```text
artifacts/13-wasm-pack-build-node-patched.exitcode.txt = 0
```

The patched generated JS no longer calls `doc.__destroy_into_raw()` in `tryEncrypt`; it passes `doc.__wbg_ptr` and `content_ref.__wbg_ptr`.

Verified the direct public JS API against the patched local package:

```bash
node scripts/09-keyhive-tryencrypt-patched-local-repro.mjs
```

Result:

```text
artifacts/15-keyhive-tryencrypt-patched-local-repro.exitcode.txt = 0
artifacts/15-keyhive-tryencrypt-patched-local-repro.stdout.log = hello
```

## Step 7: Write implementation guide and upload to reMarkable

Wrote the intern-facing implementation guide at:

```text
design/01-keyhive-tryencrypt-rust-fix-implementation-guide.md
```

Uploaded it to reMarkable as:

```text
/ai/2026/05/09/AUTODISCO-003/AUTODISCO-003_Keyhive_tryEncrypt_Rust_Fix_Guide.pdf
```
