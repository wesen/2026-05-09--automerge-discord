#!/usr/bin/env node
import * as KH from '@keyhive/keyhive'

const enc = new TextEncoder()
const dec = new TextDecoder()
function cid(values) { return new KH.ChangeId(new Uint8Array(values)) }
function errorPayload(e) { return { name: e?.name, message: e?.message, stack: String(e?.stack ?? e).split('\n').slice(0, 15), text: String(e) } }

async function run({ useDocRef, useArchive }) {
  const kh = await KH.Keyhive.init(KH.Signer.generateMemory(), KH.CiphertextStore.newInMemory(), () => {})
  await kh.expandPrekeys()
  const doc = await kh.generateDocument([], cid([0]), [])

  const content = enc.encode('hello-one')
  const predRefs = [cid([10, 11, 12])]
  const contentRef = cid([13, 14, 15])
  const docArg = useDocRef ? doc.__wasm_refgen_toJsDocument() : doc
  const encrypted = useArchive
    ? await kh.tryEncryptArchive(docArg, contentRef, predRefs, content)
    : await kh.tryEncrypt(docArg, contentRef, predRefs, content)
  const decrypted = await kh.tryDecrypt(doc, encrypted.encrypted_content())

  await kh.forcePcsUpdate(doc)

  const content2 = enc.encode('hello-two')
  const contentRef2 = cid([16, 17, 18])
  const predRefs2 = [cid([13, 14, 15])]
  const docArg2 = useDocRef ? doc.__wasm_refgen_toJsDocument() : doc
  const encrypted2 = useArchive
    ? await kh.tryEncryptArchive(docArg2, contentRef2, predRefs2, content2)
    : await kh.tryEncrypt(docArg2, contentRef2, predRefs2, content2)
  const decrypted2 = await kh.tryDecrypt(doc, encrypted2.encrypted_content())

  return {
    decrypted: dec.decode(decrypted),
    decrypted2: dec.decode(decrypted2),
    docId: doc.doc_id.toString(),
  }
}

const cases = [
  { name: 'tryEncrypt direct doc', useDocRef: false, useArchive: false },
  { name: 'tryEncrypt doc ref', useDocRef: true, useArchive: false },
  { name: 'tryEncryptArchive direct doc', useDocRef: false, useArchive: true },
]

const results = []
for (const c of cases) {
  try {
    const value = await run(c)
    results.push({ ok: true, ...c, ...value })
    console.error(`PASS ${c.name}`)
  } catch (e) {
    results.push({ ok: false, ...c, error: errorPayload(e) })
    console.error(`FAIL ${c.name}: ${e.message}`)
  }
}
console.log(JSON.stringify({ node: process.version, results, summary: { total: results.length, pass: results.filter(r => r.ok).length, fail: results.filter(r => !r.ok).length } }, null, 2))
