import type { Meta, StoryObj } from '@storybook/react-vite'
import { AcceptInvitationForm } from './AcceptInvitationForm.js'

const meta = {
  title: 'Molecules/AcceptInvitationForm',
  component: AcceptInvitationForm,
  args: {
    onAcceptInvitation: (value) => console.log('accept invitation', value),
  },
} satisfies Meta<typeof AcceptInvitationForm>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const WithInvitation: Story = {
  args: {
    initialInvitationJson: JSON.stringify({ kind: 'autodisco.invitation.v1', mode: 'keyhive-experimental', membershipEvents: ['...'] }, null, 2),
  },
}
export const Loading: Story = { args: { isLoading: true } }
