import type { Meta, StoryObj } from '@storybook/react-vite'
import { WorkspaceCard } from './WorkspaceCard.js'

const meta = {
  title: 'Molecules/WorkspaceCard',
  component: WorkspaceCard,
  args: {
    name: 'Intern Guild',
    workspaceDocUrl: 'automerge:3igFJLhCPexfV2mWwkEB9eB14eQC',
    syncUrl: 'ws://localhost:3030/sync',
    status: 'ok',
  },
} satisfies Meta<typeof WorkspaceCard>

export default meta
type Story = StoryObj<typeof meta>

export const Created: Story = {}
export const Empty: Story = { args: { workspaceDocUrl: undefined, syncUrl: undefined, status: 'idle' } }
