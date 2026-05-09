import type { Meta, StoryObj } from '@storybook/react-vite'
import { WorkspaceCard } from './WorkspaceCard.js'

const meta = {
  title: 'Molecules/WorkspaceCard',
  component: WorkspaceCard,
  args: {
    name: 'Intern Guild',
    workspaceDocUrl: 'automerge:3igFJLhCPexfV2mWwkEB9eB14eQC',
    syncUrl: 'ws://localhost:3030/sync',
    joinUrl: 'http://127.0.0.1:5174/?doc=automerge%3A3igFJLhCPexfV2mWwkEB9eB14eQC&sync=ws%3A%2F%2Flocalhost%3A3030%2Fsync',
    workspaceGroupId: 'group:Intern Guild',
    workspaceDocumentId: 'doc:Intern Guild',
    status: 'ok',
    onCopy: (kind, value) => console.log('copy', kind, value),
    onResetLocal: () => console.log('reset local'),
  },
} satisfies Meta<typeof WorkspaceCard>

export default meta
type Story = StoryObj<typeof meta>

export const Created: Story = {}
export const Empty: Story = { args: { workspaceDocUrl: undefined, syncUrl: undefined, status: 'idle' } }
