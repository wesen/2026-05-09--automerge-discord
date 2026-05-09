import type { Meta, StoryObj } from '@storybook/react-vite'
import { fixtureIds, fixtureWorkspace } from '../../../shared/fixtures.js'
import { ChannelSidebar } from './ChannelSidebar.js'

const meta = {
  title: 'Organisms/ChannelSidebar',
  component: ChannelSidebar,
  args: {
    workspace: fixtureWorkspace,
    activeChannelId: fixtureIds.general,
    onSelectChannel: (id: string) => console.log('select', id),
  },
} satisfies Meta<typeof ChannelSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
