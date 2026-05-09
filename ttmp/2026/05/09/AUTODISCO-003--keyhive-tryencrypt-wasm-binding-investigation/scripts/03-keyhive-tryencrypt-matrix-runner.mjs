#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const caseScript = join(here, '02-keyhive-tryencrypt-case.mjs')
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'node_modules/@keyhive/keyhive/package.json'), 'utf8'))

const specs = []
for (const expandPrekeys of [false, true]) {
  for (const withGroup of [false, true]) {
    for (const archive of [false, true]) {
      for (const initialBytes of [[1, 2, 3], 32]) {
        for (const predRefs of ['none', 'fresh', 'initial']) {
          specs.push({
            name: `expand=${expandPrekeys} group=${withGroup} archive=${archive} init=${Array.isArray(initialBytes) ? '3' : '32'} pred=${predRefs}`,
            expandPrekeys,
            withGroup,
            archive,
            initialBytes,
            contentBytes: [13, 14, 15],
            predRefs,
            predBytes: [10, 11, 12],
          })
        }
      }
    }
  }
}

const results = []
for (const spec of specs) {
  const child = spawnSync(process.execPath, [caseScript, JSON.stringify(spec)], { encoding: 'utf8' })
  let payload
  const stdout = child.stdout.trim().split('\n').filter(Boolean).at(-1) ?? ''
  try {
    payload = JSON.parse(stdout)
  } catch (e) {
    payload = {
      ok: false,
      stage: 'parent-json-parse',
      spec,
      error: { message: e.message },
      stdout: child.stdout,
      stderr: child.stderr,
    }
  }
  payload.name = spec.name
  payload.exitCode = child.status
  payload.signal = child.signal
  payload.stderr = child.stderr.trim().split('\n').slice(0, 20)
  results.push(payload)
  console.error(`${payload.ok ? 'PASS' : 'FAIL'} ${spec.name} exit=${child.status} stage=${payload.stage}${payload.error?.message ? ` :: ${payload.error.message}` : ''}`)
}

const summary = {
  total: results.length,
  pass: results.filter((r) => r.ok).length,
  fail: results.filter((r) => !r.ok).length,
  byStage: Object.fromEntries([...new Set(results.map((r) => r.stage))].map((stage) => [stage, results.filter((r) => r.stage === stage).length])),
}

console.log(JSON.stringify({
  node: process.version,
  platform: process.platform,
  package: { name: packageJson.name, version: packageJson.version },
  summary,
  results,
}, null, 2))
