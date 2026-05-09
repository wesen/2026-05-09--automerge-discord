import { expect, test } from '@playwright/test'

test('two isolated browser sessions exchange messages through Automerge sync', async ({ browser, request, baseURL }) => {
  if (!baseURL) throw new Error('missing baseURL')
  const health = await request.get('http://127.0.0.1:3030/healthz')
  expect(health.ok(), 'chat-server must be running; use devctl up/start chat-server').toBe(true)

  const aliceContext = await browser.newContext()
  const bobContext = await browser.newContext()
  const alice = await aliceContext.newPage()
  const bob = await bobContext.newPage()

  try {
    await alice.goto(baseURL)
    await alice.getByRole('button', { name: 'Create Workspace' }).click()
    await expect(alice.getByText(/^automerge:/)).toBeVisible()
    await expect(alice.getByText('synced')).toBeVisible()

    const activeWorkspace = await alice.evaluate(() => localStorage.getItem('autodisco.activeWorkspace'))
    expect(activeWorkspace, 'created workspace metadata should be stored for sharing').toBeTruthy()

    await bob.goto(baseURL)
    await bob.evaluate((workspace) => localStorage.setItem('autodisco.activeWorkspace', workspace!), activeWorkspace)
    await bob.reload()
    await expect(bob.getByText('synced')).toBeVisible()

    const aliceMessage = `alice-${Date.now()}`
    const bobMessage = `bob-${Date.now()}`

    await alice.getByRole('textbox', { name: 'Type a message…' }).fill(aliceMessage)
    await alice.getByRole('button', { name: 'Send' }).click()
    await expect(bob.getByText(aliceMessage)).toBeVisible()

    await bob.getByRole('textbox', { name: 'Type a message…' }).fill(bobMessage)
    await bob.getByRole('button', { name: 'Send' }).click()
    await expect(alice.getByText(bobMessage)).toBeVisible()
  } finally {
    await aliceContext.close()
    await bobContext.close()
  }
})
