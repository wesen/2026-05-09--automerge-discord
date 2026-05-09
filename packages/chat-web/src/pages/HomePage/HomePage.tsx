import { useMemo, useState } from 'react'
import { Provider } from 'react-redux'
import type { ChannelId } from '@autodisco/chat-core'
import { useCreateWorkspaceMutation } from '../../features/bootstrap/bootstrapApi.js'
import { store } from '../../app/store.js'
import { fixtureIds, fixtureWorkspace } from '../../shared/fixtures.js'
import { MacPanel } from '../../components/atoms/MacPanel/index.js'
import { BootstrapWorkspaceForm } from '../../components/molecules/BootstrapWorkspaceForm/index.js'
import { OpenWorkspaceForm, type OpenWorkspaceFormValue } from '../../components/molecules/OpenWorkspaceForm/index.js'
import { WorkspaceCard } from '../../components/molecules/WorkspaceCard/index.js'
import { ChatShell } from '../../components/organisms/ChatShell/index.js'
import { deriveDefaultSyncUrl } from '../../features/automerge/repo.js'
import { getLocalIdentity } from '../../features/automerge/identity.js'
import { useEnsureWorkspaceReady, useWorkspaceActions, useWorkspaceDoc } from '../../features/automerge/useWorkspaceDoc.js'

interface ActiveWorkspace {
  workspaceDocUrl: string
  syncUrl: string
  label: string
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
  const [createWorkspace, result] = useCreateWorkspaceMutation()
  const workspaceState = useWorkspaceDoc(activeWorkspace?.workspaceDocUrl, activeWorkspace?.syncUrl)
  useEnsureWorkspaceReady(workspaceState.handle, workspaceState.doc, identity)
  const actions = useWorkspaceActions(workspaceState.handle, identity)

  const error = result.error ? 'Could not create workspace. Is devctl up running?' : workspaceState.error
  const visibleWorkspace = workspaceState.doc ?? fixtureWorkspace
  const syncStatus = workspaceState.status === 'ready' ? 'ok' : workspaceState.status === 'error' ? 'error' : activeWorkspace ? 'warn' : 'idle'
  const defaultSyncUrl = activeWorkspace?.syncUrl ?? result.data?.syncUrl ?? deriveDefaultSyncUrl()

  async function createAndOpenWorkspace(name: string) {
    const created = await createWorkspace({ name }).unwrap()
    saveActiveWorkspace({ workspaceDocUrl: created.workspaceDocUrl, syncUrl: created.syncUrl, label: created.workspaceId })
    setActiveWorkspace({ workspaceDocUrl: created.workspaceDocUrl, syncUrl: created.syncUrl, label: created.workspaceId })
  }

  function openWorkspace(value: OpenWorkspaceFormValue) {
    const active = { ...value, label: value.workspaceDocUrl }
    saveActiveWorkspace(active)
    setActiveWorkspace(active)
  }

  function sendMessage(channelId: ChannelId, body: string) {
    actions.send(channelId, body)
  }

  return (
    <div data-widget="autodisco" data-part="app-page">
      <section data-part="hero-panel">
        <MacPanel title="AUTODISCO">
          <p>Local-first Discord-like chatbot prototype. Monochrome, CRDT-backed, and ready for Keyhive access-control experiments.</p>
          <BootstrapWorkspaceForm isLoading={result.isLoading} error={error} onCreate={(name) => void createAndOpenWorkspace(name)} />
          <OpenWorkspaceForm defaultSyncUrl={defaultSyncUrl} onOpen={openWorkspace} />
          <WorkspaceCard
            name={workspaceState.doc?.name ?? activeWorkspace?.label ?? 'No workspace yet'}
            workspaceDocUrl={activeWorkspace?.workspaceDocUrl}
            syncUrl={activeWorkspace?.syncUrl}
            status={syncStatus}
          />
        </MacPanel>
      </section>
      <ChatShell
        workspace={visibleWorkspace}
        localMemberId={workspaceState.doc ? identity.memberId : fixtureIds.alice}
        syncStatus={syncStatus}
        onSendMessage={workspaceState.handle ? sendMessage : undefined}
      />
    </div>
  )
}

function loadActiveWorkspace(): ActiveWorkspace | undefined {
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
