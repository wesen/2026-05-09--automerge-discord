import { Provider } from 'react-redux'
import { useCreateWorkspaceMutation } from '../../features/bootstrap/bootstrapApi.js'
import { store } from '../../app/store.js'
import { fixtureIds, fixtureWorkspace } from '../../shared/fixtures.js'
import { MacPanel } from '../../components/atoms/MacPanel/index.js'
import { BootstrapWorkspaceForm } from '../../components/molecules/BootstrapWorkspaceForm/index.js'
import { WorkspaceCard } from '../../components/molecules/WorkspaceCard/index.js'
import { ChatShell } from '../../components/organisms/ChatShell/index.js'

export function HomePage() {
  return (
    <Provider store={store}>
      <HomePageContent />
    </Provider>
  )
}

export function HomePageContent() {
  const [createWorkspace, result] = useCreateWorkspaceMutation()
  const created = result.data
  const error = result.error ? 'Could not create workspace. Is devctl up running?' : undefined

  return (
    <div data-widget="autodisco" data-part="app-page">
      <section data-part="hero-panel">
        <MacPanel title="AUTODISCO">
          <p>Local-first Discord-like chatbot prototype. Monochrome, CRDT-backed, and ready for Keyhive access-control experiments.</p>
          <BootstrapWorkspaceForm isLoading={result.isLoading} error={error} onCreate={(name) => void createWorkspace({ name })} />
          <WorkspaceCard name={created?.workspaceId ?? 'No workspace yet'} workspaceDocUrl={created?.workspaceDocUrl} syncUrl={created?.syncUrl} status={created ? 'ok' : 'idle'} />
        </MacPanel>
      </section>
      <ChatShell workspace={fixtureWorkspace} localMemberId={fixtureIds.alice} syncStatus={created ? 'ok' : 'warn'} />
    </div>
  )
}
