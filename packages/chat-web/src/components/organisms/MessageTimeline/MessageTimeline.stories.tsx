import type { Meta, StoryObj } from '@storybook/react-vite'
import { fixtureIds, fixtureWorkspace } from '../../../shared/fixtures.js'
import { MessageTimeline } from './MessageTimeline.js'

const meta = {
  title: 'Organisms/MessageTimeline',
  component: MessageTimeline,
  args: {
    workspace: fixtureWorkspace,
    channelId: fixtureIds.general,
    localMemberId: fixtureIds.alice,
  },
} satisfies Meta<typeof MessageTimeline>

export default meta
type Story = StoryObj<typeof meta>

export const WithMessages: Story = {}
export const Empty: Story = { args: { channelId: fixtureIds.bots } }
