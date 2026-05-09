import type { Meta, StoryObj } from '@storybook/react-vite'
import { BootstrapWorkspaceForm } from './BootstrapWorkspaceForm.js'

const meta = {
  title: 'Molecules/BootstrapWorkspaceForm',
  component: BootstrapWorkspaceForm,
  args: {
    onCreate: (name: string) => console.log('create workspace', name),
  },
} satisfies Meta<typeof BootstrapWorkspaceForm>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {}
export const Loading: Story = { args: { isLoading: true } }
export const Error: Story = { args: { error: 'Relay unavailable.' } }
