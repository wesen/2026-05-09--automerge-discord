import { describe, expect, it } from 'vitest'
import * as KeyhiveWasm from '@keyhive/keyhive'

describe('Keyhive WASM spike', () => {
  it('encrypts and decrypts document content using the verified tryEncrypt document-ref path', async () => {
    const keyhive = await KeyhiveWasm.Keyhive.init(
      KeyhiveWasm.Signer.generateMemory(),
      KeyhiveWasm.CiphertextStore.newInMemory(),
      () => undefined,
    )
    await keyhive.expandPrekeys()
    const doc = await keyhive.generateDocument([], new KeyhiveWasm.ChangeId(new Uint8Array([0])), [])
    const encrypted = await keyhive.tryEncrypt(
      cloneDocumentForTryEncrypt(doc),
      new KeyhiveWasm.ChangeId(new Uint8Array([13, 14, 15])),
      [new KeyhiveWasm.ChangeId(new Uint8Array([10, 11, 12]))],
      new TextEncoder().encode('hello'),
    )
    const plaintext = await keyhive.tryDecrypt(doc, encrypted.encrypted_content())
    expect(new TextDecoder().decode(plaintext)).toBe('hello')
  }, 20_000)

  it('initializes identities, exchanges a contact card, creates group/document, delegates, revokes, and exports events', async () => {
    const events: unknown[] = []
    const alice = await KeyhiveWasm.Keyhive.init(
      KeyhiveWasm.Signer.generateMemory(),
      KeyhiveWasm.CiphertextStore.newInMemory(),
      (event: unknown) => events.push(event),
    )
    const bob = await KeyhiveWasm.Keyhive.init(
      KeyhiveWasm.Signer.generateMemory(),
      KeyhiveWasm.CiphertextStore.newInMemory(),
      () => undefined,
    )

    const bobCardJson = (await bob.contactCard()).toJson()
    const bobIndividual = await alice.receiveContactCard(KeyhiveWasm.ContactCard.fromJson(bobCardJson))
    const group = await alice.generateGroup([])
    const zeroChange = new KeyhiveWasm.ChangeId(new Uint8Array(32))
    const doc = await alice.generateDocument([group.toPeer()], zeroChange, [])
    const access = KeyhiveWasm.Access.tryFromString('read')
    expect(access?.toString()).toBe('Read')

    const delegation = await alice.addMember(bobIndividual.toAgent(), doc.toMembered(), access!, [])
    const revocations = await alice.revokeMember(bobIndividual.toAgent(), true, doc.toMembered())
    const archive = await alice.toArchive()
    const exported = await alice.eventsForAgent(bobIndividual.toAgent())

    expect(alice.idString).toMatch(/^0x/)
    expect(bobCardJson).toContain('Rotate')
    expect(group.groupId.toString()).toMatch(/^0x/)
    expect(doc.doc_id.toString()).toMatch(/^0x/)
    expect(delegation.verify()).toBe(true)
    expect(revocations.length).toBeGreaterThanOrEqual(1)
    expect(archive.toBytes().length).toBeGreaterThan(0)
    expect(events.length).toBeGreaterThan(0)
    expect(exported.size).toBeGreaterThanOrEqual(0)
  }, 20_000)
})

function cloneDocumentForTryEncrypt(doc: KeyhiveWasm.Document): KeyhiveWasm.Document {
  const maybeClone = (doc as unknown as { __wasm_refgen_toJsDocument?: () => KeyhiveWasm.Document }).__wasm_refgen_toJsDocument
  return maybeClone ? maybeClone.call(doc) : doc
}
