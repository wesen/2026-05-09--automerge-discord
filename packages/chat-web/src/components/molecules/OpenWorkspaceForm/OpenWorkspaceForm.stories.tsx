import type { Meta, StoryObj } from '@storybook/react-vite'
import { OpenWorkspaceForm } from './OpenWorkspaceForm.js'

const meta = {
  title: 'Molecules/OpenWorkspaceForm',
  component: OpenWorkspaceForm,
  args: {
    defaultSyncUrl: 'ws://localhost:3030/sync',
    onOpen: (value) => console.log('open workspace', value),
  },
} satisfies Meta<typeof OpenWorkspaceForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
