#!/usr/bin/env node
import * as KH from '@keyhive/keyhive'

const enc = new TextEncoder()
const dec = new TextDecoder()

function err(e) {
  return {
    name: e?.name,
    message: e?.message,
    stackFirst: String(e?.stack ?? e).split('\n').slice(0, 8),
    text: String(e),
  }
}

function bytes(arrOrLen, fill = undefined) {
  if (Array.isArray(arrOrLen)) return new Uint8Array(arrOrLen)
  const out = new Uint8Array(arrOrLen)
  if (fill !== undefined) out.fill(fill)
  else for (let i = 0; i < out.length; i += 1) out[i] = i + 1
  return out
}

function change(arrOrLen, fill = undefined) {
  return new KH.ChangeId(bytes(arrOrLen, fill))
}

async function makeKh({ expandPrekeys }) {
  const events = []
  const kh = await KH.Keyhive.init(KH.Signer.generateMemory(), KH.CiphertextStore.newInMemory(), (event) => events.push(event?.variant ?? 'unknown'))
  if (expandPrekeys) await kh.expandPrekeys()
  return { kh, events }
}

async function runCase(spec) {
  const result = { name: spec.name }
  try {
    const { kh, events } = await makeKh(spec)
    const group = spec.withGroup ? await kh.generateGroup([]) : undefined
    const initial = change(spec.initialBytes)
    const doc = await kh.generateDocument(group ? [group.toPeer()] : [], initial, [])
    const contentRef = spec.contentSameAsInitial ? initial : change(spec.contentBytes)
    const predRefs = spec.predRefs === 'none' ? [] : spec.predRefs === 'initial' ? [initial] : spec.predRefs === 'fresh' ? [change(spec.predBytes)] : []
    const encryptedWithUpdate = spec.archive
      ? await kh.tryEncryptArchive(doc, contentRef, predRefs, enc.encode('hello'))
      : await kh.tryEncrypt(doc, contentRef, predRefs, enc.encode('hello'))
    const encrypted = encryptedWithUpdate.encrypted_content()
    const plain = await kh.tryDecrypt(doc, encrypted)
    Object.assign(result, {
      ok: true,
      decrypted: dec.decode(plain),
      events,
      docId: doc.doc_id.toString(),
      encryptedBytes: encrypted.toBytes().length,
    })
  } catch (e) {
    Object.assign(result, { ok: false, error: err(e) })
  }
  return result
}

const cases = []
for (const expandPrekeys of [false, true]) {
  for (const withGroup of [false, true]) {
    for (const archive of [false, true]) {
      for (const initialBytes of [[1, 2, 3], 32]) {
        cases.push({
          name: `expand=${expandPrekeys} group=${withGroup} archive=${archive} init=${Array.isArray(initialBytes) ? '3' : '32'} pred=none content=fresh3`,
          expandPrekeys,
          withGroup,
          archive,
          initialBytes,
          contentBytes: [13, 14, 15],
          predRefs: 'none',
        })
        cases.push({
          name: `expand=${expandPrekeys} group=${withGroup} archive=${archive} init=${Array.isArray(initialBytes) ? '3' : '32'} pred=fresh content=fresh3`,
          expandPrekeys,
          withGroup,
          archive,
          initialBytes,
          contentBytes: [13, 14, 15],
          predRefs: 'fresh',
          predBytes: [10, 11, 12],
        })
        cases.push({
          name: `expand=${expandPrekeys} group=${withGroup} archive=${archive} init=${Array.isArray(initialBytes) ? '3' : '32'} pred=initial content=fresh3`,
          expandPrekeys,
          withGroup,
          archive,
          initialBytes,
          contentBytes: [13, 14, 15],
          predRefs: 'initial',
        })
      }
    }
  }
}

const results = []
for (const spec of cases) {
  const result = await runCase(spec)
  results.push(result)
  console.error(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.ok ? '' : ` :: ${result.error.message}`}`)
}

console.log(JSON.stringify({
  packageVersion: KH?.default?.version ?? undefined,
  node: process.version,
  results,
  summary: {
    total: results.length,
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
  },
}, null, 2))
