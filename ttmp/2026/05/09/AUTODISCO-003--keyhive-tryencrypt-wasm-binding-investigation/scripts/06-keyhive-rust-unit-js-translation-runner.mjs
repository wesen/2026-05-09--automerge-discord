#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const tmp = join(here, '.06-case.tmp.mjs')
const cases = [
  { name: 'tryEncrypt direct doc', useDocRef: false, useArchive: false },
  { name: 'tryEncrypt doc ref', useDocRef: true, useArchive: false },
  { name: 'tryEncryptArchive direct doc', useDocRef: false, useArchive: true },
]

function caseCode(c) {
  return `
import * as KH from '@keyhive/keyhive'
const enc = new TextEncoder(); const dec = new TextDecoder();
function cid(v){return new KH.ChangeId(new Uint8Array(v))}
process.on('uncaughtException', e => { console.log(JSON.stringify({ok:false, stage:'uncaughtException', name:${JSON.stringify(c.name)}, error:{message:e.message, stack:String(e.stack).split('\\n').slice(0,12)}})); process.exit(51) })
const kh = await KH.Keyhive.init(KH.Signer.generateMemory(), KH.CiphertextStore.newInMemory(), () => {})
await kh.expandPrekeys()
const doc = await kh.generateDocument([], cid([0]), [])
const content = new TextEncoder().encode('hello-one')
const contentRef = cid([13,14,15])
const docArg = ${c.useDocRef ? 'doc.__wasm_refgen_toJsDocument()' : 'doc'}
const encrypted = await kh.${c.useArchive ? 'tryEncryptArchive' : 'tryEncrypt'}(docArg, contentRef, [cid([10,11,12])], content)
const decrypted = await kh.tryDecrypt(doc, encrypted.encrypted_content())
await kh.forcePcsUpdate(doc)
const docArg2 = ${c.useDocRef ? 'doc.__wasm_refgen_toJsDocument()' : 'doc'}
const encrypted2 = await kh.${c.useArchive ? 'tryEncryptArchive' : 'tryEncrypt'}(docArg2, cid([16,17,18]), [cid([13,14,15])], new TextEncoder().encode('hello-two'))
const decrypted2 = await kh.tryDecrypt(doc, encrypted2.encrypted_content())
console.log(JSON.stringify({ok:true, stage:'complete', name:${JSON.stringify(c.name)}, decrypted:dec.decode(decrypted), decrypted2:dec.decode(decrypted2), docId:doc.doc_id.toString()}))
`
}

const results = []
for (const c of cases) {
  writeFileSync(tmp, caseCode(c))
  const child = spawnSync(process.execPath, [tmp], { encoding: 'utf8' })
  const last = child.stdout.trim().split('\n').filter(Boolean).at(-1) ?? ''
  let payload
  try { payload = JSON.parse(last) } catch (e) { payload = { ok:false, stage:'parse', name:c.name, error:{message:e.message}, stdout:child.stdout, stderr:child.stderr } }
  payload.exitCode = child.status
  payload.stderr = child.stderr.trim().split('\n').slice(0, 12)
  results.push(payload)
  console.error(`${payload.ok ? 'PASS' : 'FAIL'} ${c.name} stage=${payload.stage} exit=${child.status} ${payload.error?.message ?? ''}`)
}
console.log(JSON.stringify({ node: process.version, results, summary:{ total:results.length, pass:results.filter(r=>r.ok).length, fail:results.filter(r=>!r.ok).length }}, null, 2))
