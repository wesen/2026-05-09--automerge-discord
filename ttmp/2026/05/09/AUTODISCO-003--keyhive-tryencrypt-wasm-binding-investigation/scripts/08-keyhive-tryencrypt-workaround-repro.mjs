#!/usr/bin/env node
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
  doc.__wasm_refgen_toJsDocument(),
  cid([13, 14, 15]),
  [cid([10, 11, 12])],
  new TextEncoder().encode('hello'),
)
const plaintext = await kh.tryDecrypt(doc, encryptedWithUpdate.encrypted_content())
console.log(new TextDecoder().decode(plaintext))
