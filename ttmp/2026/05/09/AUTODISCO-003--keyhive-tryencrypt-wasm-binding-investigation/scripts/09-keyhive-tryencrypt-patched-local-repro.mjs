#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(here, '../../../../../../vendor/keyhive-src/keyhive_wasm/pkg-node-patched/keyhive_wasm.js')
const KH = await import(pkg)

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
