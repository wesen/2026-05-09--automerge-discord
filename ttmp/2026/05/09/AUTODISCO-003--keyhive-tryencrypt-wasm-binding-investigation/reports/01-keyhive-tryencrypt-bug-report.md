---
Title: Keyhive tryEncrypt null pointer bug report
Ticket: AUTODISCO-003
Status: active
Topics:
  - keyhive
  - wasm
  - bug-report
  - encryption
  - e2ee
DocType: reference
Intent: long-term
RelatedFiles:
  - Path: scripts/07-keyhive-tryencrypt-minimal-repro.mjs
    Note: Minimal failing Node reproduction.
  - Path: scripts/08-keyhive-tryencrypt-workaround-repro.mjs
    Note: Minimal passing workaround using `doc.__wasm_refgen_toJsDocument()`.
  - Path: artifacts/03-keyhive-tryencrypt-matrix.json
    Note: Full matrix result: 48 cases, 16 pass, 32 fail.
  - Path: artifacts/04-generated-js-tryencrypt-snippet.txt
    Note: Generated JS wrapper showing `tryEncrypt` consumes document/content refs with `__destroy_into_raw()`.
  - Path: /home/manuel/code/wesen/2026-05-09--automerge-discord/vendor/keyhive-src/keyhive_wasm/src/js/keyhive.rs
    Note: Upstream Rust WASM binding source for `try_encrypt` and `try_encrypt_archive`.
Summary: Upstream-ready bug report for `Keyhive.tryEncrypt(doc, ...)` failing with `null pointer passed to rust` unless callers pass `doc.__wasm_refgen_toJsDocument()` or use `tryEncryptArchive`.
LastUpdated: 2026-05-09T16:08:00-04:00
---

# Keyhive `tryEncrypt` null pointer bug report

## Short summary

Calling `Keyhive.tryEncrypt(doc, contentRef, predRefs, content)` from Node with the `Document` returned by `generateDocument(...)` throws a low-level WASM/Rust error:

```text
Error: null pointer passed to rust
```

The same encryption/decryption flow succeeds when the caller passes `doc.__wasm_refgen_toJsDocument()` instead of `doc`, or when the caller uses `tryEncryptArchive(doc, ...)`.

The current evidence points to a generated JS binding / `wasm_refgen` reference-conversion issue rather than a cryptographic-domain error. The generated JS wrapper for `tryEncrypt` calls `doc.__destroy_into_raw()`, while `tryEncryptArchive` passes `doc.__wbg_ptr` without destroying the JS object. The Rust binding takes `doc: JsDocument` by value for `try_encrypt`, but takes `doc: &JsDocument` for `try_encrypt_archive`.

## Update: local Rust fix compiled and verified

After writing the first bug report, I patched the cloned Rust source locally. The minimal source fix is to change `JsKeyhive::try_encrypt` so it borrows the document and content ref instead of taking them by value, then duplicates the underlying document `Arc` before calling core encryption:

```rust
pub async fn try_encrypt(
    &self,
    doc: &JsDocument,
    content_ref: &JsChangeId,
    js_pred_refs: Vec<JsChangeIdRef>,
    content: &[u8],
) -> Result<JsEncryptedContentWithUpdate, JsEncryptError> {
    let pred_refs: Vec<JsChangeId> = js_pred_refs
        .into_iter()
        .map(|js_ref| JsChangeId::from_js_ref(&js_ref))
        .collect();

    Ok(self
        .0
        .try_encrypt_content(doc.inner.dupe(), content_ref, &pred_refs, content)
        .await?
        .into())
}
```

Patch artifact:

```text
patches/01-tryencrypt-borrow-document.patch
```

Verification:

```bash
cargo +1.90.0 check -p keyhive_wasm
RUSTUP_TOOLCHAIN=1.90.0 npx --yes wasm-pack build --out-dir pkg-node-patched --target nodejs --dev
node scripts/09-keyhive-tryencrypt-patched-local-repro.mjs
```

Results:

```text
artifacts/12-cargo-check-keyhive-wasm-rust190.exitcode.txt = 0
artifacts/13-wasm-pack-build-node-patched.exitcode.txt = 0
artifacts/15-keyhive-tryencrypt-patched-local-repro.exitcode.txt = 0
artifacts/15-keyhive-tryencrypt-patched-local-repro.stdout.log = hello
```

The patched generated JS wrapper no longer calls `doc.__destroy_into_raw()` or `content_ref.__destroy_into_raw()` inside `tryEncrypt`. It passes `doc.__wbg_ptr` and `content_ref.__wbg_ptr`, matching the ownership pattern that already made `tryEncryptArchive` work.

## Environment

Package:

```text
@keyhive/keyhive@0.0.0-alpha.56c
```

Runtime:

```text
Node.js v22.22.1
Linux
```

Installed package metadata is captured in:

```text
artifacts/10-installed-package-info.txt
```

The upstream source was cloned for inspection:

```bash
git clone --depth 1 https://github.com/inkandswitch/keyhive.git \
  vendor/keyhive-src
```

Clone HEAD:

```text
c48c35f093bf60ec8619b4ebf7e469335b4e5ee7
```

The cloned source package metadata reports `0.0.0-alpha.56`; the installed npm package reports `0.0.0-alpha.56c`.

## Minimal failing reproduction

Script:

```text
scripts/07-keyhive-tryencrypt-minimal-repro.mjs
```

Contents:

```js
import * as KH from '@keyhive/keyhive'

function cid(bytes) {
  return new KH.ChangeId(new Uint8Array(bytes))
}

const kh = await KH.Keyhive.init(
  KH.Signer.generateMemory(),
  KH.CiphertextStore.newInMemory(),
  () => undefined,
)
await kh.expandPrekeys()
const doc = await kh.generateDocument([], cid([0]), [])
const encryptedWithUpdate = await kh.tryEncrypt(
  doc,
  cid([13, 14, 15]),
  [cid([10, 11, 12])],
  new TextEncoder().encode('hello'),
)
const plaintext = await kh.tryDecrypt(doc, encryptedWithUpdate.encrypted_content())
console.log(new TextDecoder().decode(plaintext))
```

Run:

```bash
node scripts/07-keyhive-tryencrypt-minimal-repro.mjs
```

Actual exit code:

```text
1
```

Actual stderr:

```text
Error: null pointer passed to rust
    at __wbg___wbindgen_throw_81fc77679af83bc6 (.../node_modules/@keyhive/keyhive/pkg-node/keyhive_wasm.js:2618:19)
    at wasm://wasm/0075a546:wasm-function[2274]:0x1b4fe9
    at wasm://wasm/0075a546:wasm-function[2275]:0x1b4ff6
    at wasm://wasm/0075a546:wasm-function[270]:0xc5408
    at wasm://wasm/0075a546:wasm-function[773]:0x153c59
    at wasm://wasm/0075a546:wasm-function[2000]:0x1af4ae
    at wasm://wasm/0075a546:wasm-function[1706]:0x19a87b
    at wasm://wasm/0075a546:wasm-function[1956]:0x1abc70
    at wasm_bindgen__convert__closures_____invoke__h3280982d348b8ce7 (.../node_modules/@keyhive/keyhive/pkg-node/keyhive_wasm.js:3131:22)
    at real (.../node_modules/@keyhive/keyhive/pkg-node/keyhive_wasm.js:3404:20)
```

Captured output:

```text
artifacts/07-keyhive-tryencrypt-minimal-repro.stderr.log
artifacts/07-keyhive-tryencrypt-minimal-repro.exitcode.txt
```

## Minimal passing workaround

Script:

```text
scripts/08-keyhive-tryencrypt-workaround-repro.mjs
```

The only important change is passing a document ref/upcast value:

```js
const encryptedWithUpdate = await kh.tryEncrypt(
  doc.__wasm_refgen_toJsDocument(),
  cid([13, 14, 15]),
  [cid([10, 11, 12])],
  new TextEncoder().encode('hello'),
)
```

Run:

```bash
node scripts/08-keyhive-tryencrypt-workaround-repro.mjs
```

Actual exit code:

```text
0
```

Actual stdout:

```text
hello
```

Captured output:

```text
artifacts/08-keyhive-tryencrypt-workaround-repro.stdout.log
artifacts/08-keyhive-tryencrypt-workaround-repro.exitcode.txt
```

## Expected behavior

One of these should be true:

1. `tryEncrypt(doc, ...)` should accept the `Document` returned by `generateDocument(...)`, because the generated TypeScript declaration says the first parameter is `Document`.
2. If the first parameter must be a ref/upcast copy, the public API should expose that in the type or documentation and should not fail with `null pointer passed to rust`.
3. If `tryEncrypt` is intended to consume the passed `Document`, it should still not produce an async low-level null-pointer failure for the common value returned by `generateDocument(...)`.

## Observed generated JS wrapper behavior

The installed generated JS wrapper for `tryEncrypt` consumes the document and content ref with `__destroy_into_raw()`:

```js
tryEncrypt(doc, content_ref, js_pred_refs, content) {
    _assertClass(doc, Document);
    var ptr0 = doc.__destroy_into_raw();
    _assertClass(content_ref, ChangeId);
    var ptr1 = content_ref.__destroy_into_raw();
    const ptr2 = passArrayJsValueToWasm0(js_pred_refs, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(content, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ret = wasm.keyhive_tryEncrypt(this.__wbg_ptr, ptr0, ptr1, ptr2, len2, ptr3, len3);
    return ret;
}
```

The installed wrapper for `tryEncryptArchive` does not consume the document or content ref:

```js
tryEncryptArchive(doc, content_ref, pred_refs, content) {
    _assertClass(doc, Document);
    _assertClass(content_ref, ChangeId);
    const ptr0 = passArrayJsValueToWasm0(pred_refs, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(content, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.keyhive_tryEncryptArchive(this.__wbg_ptr, doc.__wbg_ptr, content_ref.__wbg_ptr, ptr0, len0, ptr1, len1);
    return ret;
}
```

Captured snippets:

```text
artifacts/04-generated-js-tryencrypt-snippet.txt
artifacts/05-generated-js-generate-document-snippet.txt
```

## Relevant Rust binding source

From cloned source `keyhive_wasm/src/js/keyhive.rs`:

```rust
#[wasm_bindgen(js_name = tryEncrypt)]
pub async fn try_encrypt(
    &self,
    doc: JsDocument,
    content_ref: JsChangeId,
    js_pred_refs: Vec<JsChangeIdRef>,
    content: &[u8],
) -> Result<JsEncryptedContentWithUpdate, JsEncryptError> {
    init_span!("JsKeyhive::try_encrypt");
    let pred_refs: Vec<JsChangeId> = js_pred_refs
        .into_iter()
        .map(|js_ref| JsChangeId::from_js_ref(&js_ref))
        .collect();

    Ok(self
        .0
        .try_encrypt_content(doc.inner, &content_ref, &pred_refs, content)
        .await?
        .into())
}
```

`tryEncryptArchive` differs by taking references and duplicating the document inner value:

```rust
#[wasm_bindgen(js_name = tryEncryptArchive)]
pub async fn try_encrypt_archive(
    &self,
    doc: &JsDocument,
    content_ref: &JsChangeId,
    pred_refs: Vec<JsChangeIdRef>,
    content: &[u8],
) -> Result<JsEncryptedContentWithUpdate, JsEncryptError> {
    init_span!("JsKeyhive::try_encrypt_archive");
    let pred_refs: Vec<JsChangeId> = pred_refs
        .into_iter()
        .map(|js_ref| JsChangeId::from_js_ref(&js_ref))
        .collect();

    Ok(self
        .0
        .try_encrypt_content(doc.inner.dupe(), content_ref, &pred_refs, content)
        .await?
        .into())
}
```

This difference is the strongest current clue. `tryEncrypt` consumes/moves `doc.inner`; `tryEncryptArchive` borrows and duplicates it. The generated JS wrapper mirrors this difference by destroying the raw JS object for `tryEncrypt` but not for `tryEncryptArchive`.

## Experiment matrix

Script:

```text
scripts/03-keyhive-tryencrypt-matrix-runner.mjs
```

Output:

```text
artifacts/03-keyhive-tryencrypt-matrix.json
```

Summary:

```json
{
  "total": 48,
  "pass": 16,
  "fail": 32,
  "byStage": {
    "uncaughtException": 32,
    "complete": 16
  }
}
```

What was varied:

- `expandPrekeys`: false / true
- document coparent group: false / true
- encryption method: `tryEncrypt` / `tryEncryptArchive`
- initial content-ref length: 3 bytes / 32 bytes
- predecessor refs: none / fresh / reused initial object

Findings:

- Every direct `tryEncrypt(doc, ...)` case failed with `null pointer passed to rust`.
- `tryEncryptArchive(doc, ...)` passed for predecessor refs `none` and `fresh`.
- `tryEncryptArchive(doc, ...)` failed when using the same `ChangeId` object that had already been passed to `generateDocument(...)` as a predecessor ref.
- The reused-initial-object failure is explainable from generated JS: `generateDocument` consumes `initial_content_ref_head` with `initial_content_ref_head.__destroy_into_raw()`. Reusing that same JS object later leaves a zero/null pointer.
- `expandPrekeys`, group/no-group document creation, and 3-byte vs 32-byte content refs did not change the direct `tryEncrypt` failure.

## Ref/upcast variant experiment

Script:

```text
scripts/04-keyhive-tryencrypt-ref-variants.mjs
```

Output:

```text
artifacts/04-keyhive-tryencrypt-ref-variants.json
```

Summary:

```json
{
  "total": 9,
  "pass": 7,
  "fail": 2
}
```

Key results:

```text
FAIL tryEncrypt-direct-doc-direct-content-empty-preds    null pointer passed to rust
PASS tryEncrypt-ref-doc-direct-content-empty-preds
FAIL tryEncrypt-direct-doc-ref-content-empty-preds       null pointer passed to rust
PASS tryEncrypt-ref-doc-ref-content-empty-preds
PASS tryEncryptArchive-direct-doc-direct-content-empty-preds
PASS tryEncryptArchive-ref-doc-direct-content-empty-preds
PASS tryEncryptArchive-direct-doc-ref-content-empty-preds
PASS tryEncryptArchive-direct-doc-direct-content-ref-pred-fresh-direct
PASS tryEncryptArchive-direct-doc-direct-content-ref-pred-fresh-ref
```

This experiment isolates the workaround. The content ref does not need special handling. The decisive factor is the document argument. Passing `doc.__wasm_refgen_toJsDocument()` makes `tryEncrypt` pass.

## Rust test translation experiment

Source Rust test in `keyhive_wasm/src/js/keyhive.rs` performs this shape:

```rust
let mut bh = setup().await;
bh.expand_prekeys().await.unwrap();
let doc = bh.generate_doc(vec![], vec![0].into(), vec![]).await?;
let content = vec![1, 2, 3, 4];
let pred_refs = vec![JsChangeId::new(vec![10, 11, 12]).into()];
let content_ref = JsChangeId::new(vec![13, 14, 15]);
let encrypted = bh
    .try_encrypt(doc.clone(), content_ref.clone(), pred_refs, &content)
    .await?;
let decrypted = bh.try_decrypt(&doc, &encrypted.encrypted_content()).await?;
```

Script:

```text
scripts/06-keyhive-rust-unit-js-translation-runner.mjs
```

Output:

```text
artifacts/06-keyhive-rust-unit-js-translation.json
```

Summary:

```json
{
  "total": 3,
  "pass": 2,
  "fail": 1
}
```

Results:

```text
FAIL tryEncrypt direct doc      null pointer passed to rust
PASS tryEncrypt doc ref         decrypted hello-one and hello-two
PASS tryEncryptArchive direct doc decrypted hello-one and hello-two
```

This is the closest JS translation of the Rust test. The Rust test uses `doc.clone()` when calling `try_encrypt`. In JS, the equivalent successful call appears to be `doc.__wasm_refgen_toJsDocument()`. Passing the original `doc` directly fails.

## Current diagnosis

The problem appears to be that the JS-facing `tryEncrypt` API consumes a `Document` argument in a way that is unsafe or surprising for the `Document` object returned by `generateDocument(...)`.

The likely root is one of these:

1. The Rust binding should take `doc: &JsDocument` and use `doc.inner.dupe()`, like `tryEncryptArchive`, unless consuming the document is intentional.
2. The generated JS type/signature should communicate that callers need to pass an upcast/ref value, not the original generated `Document` object.
3. The generated JS wrapper should not expose a common path where passing the documented `Document` type triggers an async `null pointer passed to rust` error.

The workaround demonstrates that the core encryption/decryption logic can work from JS. This is not a failure of encryption itself. It is specifically about the JS/WASM binding shape for the `tryEncrypt` document argument.

## Proposed upstream issue text

Title:

```text
Keyhive.tryEncrypt(doc, ...) throws `null pointer passed to rust` unless doc.__wasm_refgen_toJsDocument() is passed
```

Body:

```markdown
## Summary

`Keyhive.tryEncrypt(doc, contentRef, predRefs, content)` throws `Error: null pointer passed to rust` in Node when `doc` is the `Document` returned by `generateDocument(...)`. The same flow succeeds if I pass `doc.__wasm_refgen_toJsDocument()` as the first argument, and `tryEncryptArchive(doc, ...)` also succeeds.

## Update: local Rust fix compiled and verified

After writing the first bug report, I patched the cloned Rust source locally. The minimal source fix is to change `JsKeyhive::try_encrypt` so it borrows the document and content ref instead of taking them by value, then duplicates the underlying document `Arc` before calling core encryption:

```rust
pub async fn try_encrypt(
    &self,
    doc: &JsDocument,
    content_ref: &JsChangeId,
    js_pred_refs: Vec<JsChangeIdRef>,
    content: &[u8],
) -> Result<JsEncryptedContentWithUpdate, JsEncryptError> {
    let pred_refs: Vec<JsChangeId> = js_pred_refs
        .into_iter()
        .map(|js_ref| JsChangeId::from_js_ref(&js_ref))
        .collect();

    Ok(self
        .0
        .try_encrypt_content(doc.inner.dupe(), content_ref, &pred_refs, content)
        .await?
        .into())
}
```

Patch artifact:

```text
patches/01-tryencrypt-borrow-document.patch
```

Verification:

```bash
cargo +1.90.0 check -p keyhive_wasm
RUSTUP_TOOLCHAIN=1.90.0 npx --yes wasm-pack build --out-dir pkg-node-patched --target nodejs --dev
node scripts/09-keyhive-tryencrypt-patched-local-repro.mjs
```

Results:

```text
artifacts/12-cargo-check-keyhive-wasm-rust190.exitcode.txt = 0
artifacts/13-wasm-pack-build-node-patched.exitcode.txt = 0
artifacts/15-keyhive-tryencrypt-patched-local-repro.exitcode.txt = 0
artifacts/15-keyhive-tryencrypt-patched-local-repro.stdout.log = hello
```

The patched generated JS wrapper no longer calls `doc.__destroy_into_raw()` or `content_ref.__destroy_into_raw()` inside `tryEncrypt`. It passes `doc.__wbg_ptr` and `content_ref.__wbg_ptr`, matching the ownership pattern that already made `tryEncryptArchive` work.

## Environment

- Package: `@keyhive/keyhive@0.0.0-alpha.56c`
- Node: `v22.22.1`
- Platform: Linux

## Minimal failing repro

```js
import * as KH from '@keyhive/keyhive'

function cid(bytes) {
  return new KH.ChangeId(new Uint8Array(bytes))
}

const kh = await KH.Keyhive.init(
  KH.Signer.generateMemory(),
  KH.CiphertextStore.newInMemory(),
  () => undefined,
)
await kh.expandPrekeys()
const doc = await kh.generateDocument([], cid([0]), [])
const encryptedWithUpdate = await kh.tryEncrypt(
  doc,
  cid([13, 14, 15]),
  [cid([10, 11, 12])],
  new TextEncoder().encode('hello'),
)
const plaintext = await kh.tryDecrypt(doc, encryptedWithUpdate.encrypted_content())
console.log(new TextDecoder().decode(plaintext))
```

## Actual behavior

```text
Error: null pointer passed to rust
    at __wbg___wbindgen_throw_81fc77679af83bc6 (.../node_modules/@keyhive/keyhive/pkg-node/keyhive_wasm.js:2618:19)
    ...
```

## Passing workaround

```js
const encryptedWithUpdate = await kh.tryEncrypt(
  doc.__wasm_refgen_toJsDocument(),
  cid([13, 14, 15]),
  [cid([10, 11, 12])],
  new TextEncoder().encode('hello'),
)
```

This prints `hello` after decrypting.

## Source-level clue

The generated JS wrapper for `tryEncrypt` consumes the document:

```js
_assertClass(doc, Document);
var ptr0 = doc.__destroy_into_raw();
```

`tryEncryptArchive` does not consume it:

```js
_assertClass(doc, Document);
const ret = wasm.keyhive_tryEncryptArchive(this.__wbg_ptr, doc.__wbg_ptr, ...)
```

The Rust binding has the same ownership difference:

```rust
pub async fn try_encrypt(&self, doc: JsDocument, ...)
pub async fn try_encrypt_archive(&self, doc: &JsDocument, ...)
```

The Rust wasm-bindgen test uses `doc.clone()` for `try_encrypt`. In JS, `doc.__wasm_refgen_toJsDocument()` appears to be the equivalent needed clone/upcast operation.

## Expected behavior

Either `tryEncrypt(doc, ...)` should work with the `Document` returned by `generateDocument(...)`, or the public JS/TS API should make the required clone/ref argument explicit and avoid a low-level null-pointer failure.
```

## Recommendation for AUTODISCO

For AUTODISCO, the safe local conclusion is:

- Do not treat the earlier `tryEncrypt` failure as evidence that Keyhive encryption is unusable.
- Do treat the public `tryEncrypt(doc, ...)` API as unsafe/ambiguous in `0.0.0-alpha.56c`.
- If AUTODISCO resumes E2EE work before an upstream fix, call `tryEncrypt(doc.__wasm_refgen_toJsDocument(), ...)` or use `tryEncryptArchive(...)` deliberately, and add tests that prove encrypt/decrypt round-trips.
- Keep a note that `ChangeId` objects passed to methods that call `__destroy_into_raw()` must not be reused later; create a new `ChangeId` object with the same bytes if needed.
