import type { Meta, StoryObj } from '@storybook/react-vite'
import { InvitationForm } from './InvitationForm.js'

const meta = {
  title: 'Molecules/InvitationForm',
  component: InvitationForm,
  args: {
    workspaceDocumentId: 'doc:Intern Guild',
    onCreateInvitation: (value) => console.log('create invitation', value),
  },
} satisfies Meta<typeof InvitationForm>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {}
export const Disabled: Story = { args: { disabled: true, workspaceDocumentId: undefined } }
export const Loading: Story = { args: { isLoading: true } }
