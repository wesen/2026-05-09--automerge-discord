#!/usr/bin/env node
import * as KH from '@keyhive/keyhive'

const spec = JSON.parse(process.argv[2] ?? '{}')
const enc = new TextEncoder()
const dec = new TextDecoder()

function bytes(value) {
  if (Array.isArray(value)) return new Uint8Array(value)
  const out = new Uint8Array(value ?? 3)
  for (let i = 0; i < out.length; i += 1) out[i] = i + 1
  return out
}

function change(value) {
  return new KH.ChangeId(bytes(value))
}

function errorPayload(e) {
  return {
    name: e?.name,
    message: e?.message,
    stack: String(e?.stack ?? e).split('\n').slice(0, 12),
    text: String(e),
  }
}

process.on('uncaughtException', (e) => {
  console.log(JSON.stringify({ ok: false, stage: 'uncaughtException', spec, error: errorPayload(e) }))
  process.exit(41)
})
process.on('unhandledRejection', (e) => {
  console.log(JSON.stringify({ ok: false, stage: 'unhandledRejection', spec, error: errorPayload(e) }))
  process.exit(42)
})

async function main() {
  const events = []
  const kh = await KH.Keyhive.init(KH.Signer.generateMemory(), KH.CiphertextStore.newInMemory(), (event) => events.push(event?.variant ?? 'unknown'))
  if (spec.expandPrekeys) await kh.expandPrekeys()
  const group = spec.withGroup ? await kh.generateGroup([]) : undefined
  const initial = change(spec.initialBytes)
  const doc = await kh.generateDocument(group ? [group.toPeer()] : [], initial, [])
  const contentRef = spec.contentSameAsInitial ? initial : change(spec.contentBytes)
  const predRefs = spec.predRefs === 'initial' ? [initial] : spec.predRefs === 'fresh' ? [change(spec.predBytes)] : []
  const encryptedWithUpdate = spec.archive
    ? await kh.tryEncryptArchive(doc, contentRef, predRefs, enc.encode('hello'))
    : await kh.tryEncrypt(doc, contentRef, predRefs, enc.encode('hello'))
  const encrypted = encryptedWithUpdate.encrypted_content()
  const plain = await kh.tryDecrypt(doc, encrypted)
  console.log(JSON.stringify({
    ok: true,
    stage: 'complete',
    spec,
    docId: doc.doc_id.toString(),
    decrypted: dec.decode(plain),
    encryptedBytes: encrypted.toBytes().length,
    eventVariants: events,
  }))
}

await main().catch((e) => {
  console.log(JSON.stringify({ ok: false, stage: 'caught', spec, error: errorPayload(e) }))
  process.exit(40)
})
