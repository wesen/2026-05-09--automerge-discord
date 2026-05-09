#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const tmpCase = join(here, '.04-ref-variant-case.tmp.mjs')

const variants = [
  { name: 'tryEncrypt-direct-doc-direct-content-empty-preds', docRef: false, contentRef: false, predMode: 'none', archive: false },
  { name: 'tryEncrypt-ref-doc-direct-content-empty-preds', docRef: true, contentRef: false, predMode: 'none', archive: false },
  { name: 'tryEncrypt-direct-doc-ref-content-empty-preds', docRef: false, contentRef: true, predMode: 'none', archive: false },
  { name: 'tryEncrypt-ref-doc-ref-content-empty-preds', docRef: true, contentRef: true, predMode: 'none', archive: false },
  { name: 'tryEncryptArchive-direct-doc-direct-content-empty-preds', docRef: false, contentRef: false, predMode: 'none', archive: true },
  { name: 'tryEncryptArchive-ref-doc-direct-content-empty-preds', docRef: true, contentRef: false, predMode: 'none', archive: true },
  { name: 'tryEncryptArchive-direct-doc-ref-content-empty-preds', docRef: false, contentRef: true, predMode: 'none', archive: true },
  { name: 'tryEncryptArchive-direct-doc-direct-content-ref-pred-fresh-direct', docRef: false, contentRef: false, predMode: 'fresh-direct', archive: true },
  { name: 'tryEncryptArchive-direct-doc-direct-content-ref-pred-fresh-ref', docRef: false, contentRef: false, predMode: 'fresh-ref', archive: true },
]

function scriptFor(v) {
  return `
import * as KH from '@keyhive/keyhive'
const enc = new TextEncoder(); const dec = new TextDecoder();
function cid(a){ return new KH.ChangeId(new Uint8Array(a)) }
process.on('uncaughtException', e => { console.log(JSON.stringify({ ok:false, stage:'uncaughtException', name:${JSON.stringify(v.name)}, message:e.message, stack:String(e.stack).split('\\n').slice(0,10) })); process.exit(31) })
const kh = await KH.Keyhive.init(KH.Signer.generateMemory(), KH.CiphertextStore.newInMemory(), ()=>{})
const doc = await kh.generateDocument([], cid([1,2,3]), [])
const docArg = ${v.docRef ? 'doc.__wasm_refgen_toJsDocument()' : 'doc'}
const content = cid([13,14,15])
const contentArg = ${v.contentRef ? 'content.__wasm_refgen_toJsChangeId()' : 'content'}
const preds = ${v.predMode === 'none' ? '[]' : v.predMode === 'fresh-direct' ? '[cid([10,11,12])]' : '[cid([10,11,12]).__wasm_refgen_toJsChangeId()]'}
const ewu = await kh.${v.archive ? 'tryEncryptArchive' : 'tryEncrypt'}(docArg, contentArg, preds, enc.encode('hello'))
const encrypted = ewu.encrypted_content()
const plain = await kh.tryDecrypt(${v.archive ? 'doc' : v.docRef ? 'doc' : 'docArg'}, encrypted)
console.log(JSON.stringify({ ok:true, stage:'complete', name:${JSON.stringify(v.name)}, decrypted:dec.decode(plain), encryptedBytes:encrypted.toBytes().length }))
`
}

const results = []
for (const v of variants) {
  writeFileSync(tmpCase, scriptFor(v))
  const child = spawnSync(process.execPath, [tmpCase], { encoding: 'utf8' })
  const last = child.stdout.trim().split('\n').filter(Boolean).at(-1) ?? ''
  let payload
  try { payload = JSON.parse(last) } catch (e) { payload = { ok:false, stage:'parse', name:v.name, stdout: child.stdout, stderr: child.stderr, message:e.message } }
  payload.exitCode = child.status
  payload.stderr = child.stderr.trim().split('\n').slice(0, 15)
  results.push(payload)
  console.error(`${payload.ok ? 'PASS' : 'FAIL'} ${v.name} stage=${payload.stage} exit=${child.status} ${payload.message ?? ''}`)
}
console.log(JSON.stringify({ node: process.version, results, summary: { total: results.length, pass: results.filter(r=>r.ok).length, fail: results.filter(r=>!r.ok).length } }, null, 2))
