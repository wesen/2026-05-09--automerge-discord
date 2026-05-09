import { useCallback, useEffect, useMemo, useState } from 'react'
import { Provider } from 'react-redux'
import type { ChannelId } from '@autodisco/chat-core'
import { useCreateWorkspaceMutation } from '../../features/bootstrap/bootstrapApi.js'
import { store } from '../../app/store.js'
import { fixtureIds, fixtureWorkspace } from '../../shared/fixtures.js'
import { MacPanel } from '../../components/atoms/MacPanel/index.js'
import { BootstrapWorkspaceForm } from '../../components/molecules/BootstrapWorkspaceForm/index.js'
import { IdentityCard } from '../../components/molecules/IdentityCard/index.js'
import { OpenWorkspaceForm, type OpenWorkspaceFormValue } from '../../components/molecules/OpenWorkspaceForm/index.js'
import { WorkspaceCard, type WorkspaceCopyKind } from '../../components/molecules/WorkspaceCard/index.js'
import { ChatShell } from '../../components/organisms/ChatShell/index.js'
import { LogPane, type LogEntry, type LogLevel } from '../../components/organisms/LogPane/index.js'
import { deriveDefaultSyncUrl, resetBrowserRepoStorage } from '../../features/automerge/repo.js'
import { getLocalIdentity, stringifyContactCard } from '../../features/automerge/identity.js'
import { useEnsureWorkspaceReady, useWorkspaceActions, useWorkspaceDoc } from '../../features/automerge/useWorkspaceDoc.js'

interface ActiveWorkspace {
  workspaceDocUrl: string
  syncUrl: string
  label: string
  keyhive?: {
    workspaceGroupId: string
    workspaceDocumentId: string
  }
}

export function HomePage() {
  return (
    <Provider store={store}>
      <HomePageContent />
    </Provider>
  )
}

export function HomePageContent() {
  const identity = useMemo(() => getLocalIdentity(), [])
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace | undefined>(() => loadActiveWorkspace())
  const [logs, setLogs] = useState<LogEntry[]>(() => [{ id: crypto.randomUUID(), at: new Date().toISOString(), level: 'info', message: 'AUTODISCO client booted' }])
  const [logOpen, setLogOpen] = useState(false)
  const appendLog = useCallback((level: LogLevel, message: string, detail?: string) => {
    setLogs((entries) => [{ id: crypto.randomUUID(), at: new Date().toISOString(), level, message, detail }, ...entries].slice(0, 100))
  }, [])
  const [createWorkspace, result] = useCreateWorkspaceMutation()
  const workspaceState = useWorkspaceDoc(activeWorkspace?.workspaceDocUrl, activeWorkspace?.syncUrl)
  useEnsureWorkspaceReady(workspaceState.handle, workspaceState.doc, identity)
  const actions = useWorkspaceActions(workspaceState.handle, identity)

  const error = result.error ? 'Could not create workspace. Is devctl up running?' : workspaceState.error
  const visibleWorkspace = workspaceState.doc ?? fixtureWorkspace
  const syncStatus = workspaceState.status === 'ready' ? 'ok' : workspaceState.status === 'error' ? 'error' : activeWorkspace ? 'warn' : 'idle'
  const defaultSyncUrl = activeWorkspace?.syncUrl ?? result.data?.syncUrl ?? deriveDefaultSyncUrl()
  const joinUrl = useMemo(() => buildJoinUrl(activeWorkspace), [activeWorkspace])

  useEffect(() => {
    if (!activeWorkspace) return
    if (workspaceState.status === 'loading') appendLog('info', 'Opening Automerge workspace', activeWorkspace.workspaceDocUrl)
    if (workspaceState.status === 'ready') appendLog('ok', 'Workspace document ready', `${workspaceState.doc?.name ?? activeWorkspace.label} · ${activeWorkspace.syncUrl}`)
    if (workspaceState.status === 'error') appendLog('error', 'Workspace failed to open', workspaceState.error)
  }, [activeWorkspace, appendLog, workspaceState.doc?.name, workspaceState.error, workspaceState.status])

  async function createAndOpenWorkspace(name: string) {
    appendLog('info', 'Creating workspace through bootstrap API', name)
    try {
      const created = await createWorkspace({ name }).unwrap()
      const active = { workspaceDocUrl: created.workspaceDocUrl, syncUrl: created.syncUrl, label: created.workspaceId, keyhive: created.keyhive }
      saveActiveWorkspace(active)
      setActiveWorkspace(active)
      appendLog('ok', 'Created workspace', `${created.workspaceId} · ${created.workspaceDocUrl}`)
    } catch (error) {
      appendLog('error', 'Create workspace failed', error instanceof Error ? error.message : String(error))
    }
  }

  function openWorkspace(value: OpenWorkspaceFormValue) {
    const active = { ...value, label: value.workspaceDocUrl }
    saveActiveWorkspace(active)
    setActiveWorkspace(active)
    appendLog('info', 'Opening pasted workspace', `${value.workspaceDocUrl} · ${value.syncUrl}`)
  }

  function sendMessage(channelId: ChannelId, body: string) {
    appendLog('info', 'Sending message through Automerge change', `${channelId}: ${body}`)
    actions.send(channelId, body)
  }

  async function copyContactCard() {
    try {
      const contactCard = stringifyContactCard(identity)
      await copyToClipboard(contactCard)
      appendLog('ok', 'Copied mock contact card', identity.memberId)
    } catch (error) {
      appendLog('error', 'Could not copy contact card', error instanceof Error ? error.message : String(error))
    }
  }

  async function copyWorkspaceValue(kind: WorkspaceCopyKind, value: string) {
    try {
      await copyToClipboard(value)
      appendLog('ok', `Copied ${kind} value`, value)
    } catch (error) {
      appendLog('error', `Could not copy ${kind} value`, error instanceof Error ? error.message : String(error))
    }
  }

  async function resetLocalSession() {
    appendLog('warn', 'Resetting local browser session', activeWorkspace?.syncUrl)
    try {
      if (activeWorkspace?.syncUrl) await resetBrowserRepoStorage(activeWorkspace.syncUrl)
      localStorage.removeItem('autodisco.activeWorkspace')
      localStorage.removeItem('autodisco.memberId')
      localStorage.removeItem('autodisco.displayName')
      localStorage.removeItem('autodisco.publicKey')
      sessionStorage.removeItem('autodisco.peerId')
      setActiveWorkspace(undefined)
      if (typeof window !== 'undefined') window.location.replace(`${window.location.origin}${window.location.pathname}`)
    } catch (error) {
      appendLog('error', 'Reset local session failed', error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div data-widget="autodisco" data-part="app-page">
      <section data-part="hero-panel">
        <MacPanel title="AUTODISCO">
          <p>Local-first Discord-like chatbot prototype. Monochrome, CRDT-backed, and ready for Keyhive access-control experiments.</p>
          <IdentityCard
            displayName={identity.displayName}
            memberId={identity.memberId}
            publicKeyFingerprint={identity.publicKeyFingerprint}
            mode="mock"
            onCopyContactCard={() => void copyContactCard()}
          />
          <BootstrapWorkspaceForm isLoading={result.isLoading} error={error} onCreate={(name) => void createAndOpenWorkspace(name)} />
          <OpenWorkspaceForm defaultSyncUrl={defaultSyncUrl} onOpen={openWorkspace} />
          <WorkspaceCard
            name={workspaceState.doc?.name ?? activeWorkspace?.label ?? 'No workspace yet'}
            workspaceDocUrl={activeWorkspace?.workspaceDocUrl}
            syncUrl={activeWorkspace?.syncUrl}
            joinUrl={joinUrl}
            workspaceGroupId={workspaceState.doc?.keyhive?.workspaceGroupId ?? activeWorkspace?.keyhive?.workspaceGroupId}
            workspaceDocumentId={workspaceState.doc?.keyhive?.workspaceDocumentId ?? activeWorkspace?.keyhive?.workspaceDocumentId}
            status={syncStatus}
            onCopy={copyWorkspaceValue}
            onResetLocal={activeWorkspace ? () => void resetLocalSession() : undefined}
          />
        </MacPanel>
      </section>
      <section data-part="work-area">
        <ChatShell
          workspace={visibleWorkspace}
          localMemberId={workspaceState.doc ? identity.memberId : fixtureIds.alice}
          syncStatus={syncStatus}
          onSendMessage={workspaceState.handle ? sendMessage : undefined}
        />
        <LogPane entries={logs} open={logOpen} onToggle={() => setLogOpen((open) => !open)} onClear={() => setLogs([])} />
      </section>
    </div>
  )
}

function loadActiveWorkspace(): ActiveWorkspace | undefined {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const workspaceDocUrl = params.get('doc') ?? params.get('workspace')
    const syncUrl = params.get('sync')
    if (workspaceDocUrl) {
      const active = {
        workspaceDocUrl,
        syncUrl: syncUrl ?? deriveDefaultSyncUrl(),
        label: params.get('label') ?? workspaceDocUrl,
      }
      saveActiveWorkspace(active)
      return active
    }
  }

  if (typeof localStorage === 'undefined') return undefined
  const raw = localStorage.getItem('autodisco.activeWorkspace')
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as ActiveWorkspace
    return parsed.workspaceDocUrl && parsed.syncUrl ? parsed : undefined
  } catch {
    return undefined
  }
}

function saveActiveWorkspace(workspace: ActiveWorkspace): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem('autodisco.activeWorkspace', JSON.stringify(workspace))
}

function buildJoinUrl(workspace?: ActiveWorkspace): string | undefined {
  if (!workspace || typeof window === 'undefined') return undefined
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('doc', workspace.workspaceDocUrl)
  url.searchParams.set('sync', workspace.syncUrl)
  url.searchParams.set('label', workspace.label)
  return url.toString()
}

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}
