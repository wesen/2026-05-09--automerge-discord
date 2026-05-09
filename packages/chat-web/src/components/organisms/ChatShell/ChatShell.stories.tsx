import type { Meta, StoryObj } from '@storybook/react-vite'
import { fixtureIds, fixtureWorkspace } from '../../../shared/fixtures.js'
import { ChatShell } from './ChatShell.js'

const meta = {
  title: 'Organisms/ChatShell',
  component: ChatShell,
  parameters: { layout: 'fullscreen' },
  args: {
    workspace: fixtureWorkspace,
    localMemberId: fixtureIds.alice,
    syncStatus: 'ok',
    onSendMessage: (channelId: string, body: string) => console.log('send', channelId, body),
  },
} satisfies Meta<typeof ChatShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Offline: Story = { args: { syncStatus: 'warn' } }
