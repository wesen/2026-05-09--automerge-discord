import type { Meta, StoryObj } from '@storybook/react-vite'
import { IdentityCard } from './IdentityCard.js'

const meta = {
  title: 'Molecules/IdentityCard',
  component: IdentityCard,
  args: {
    displayName: 'Peer 314',
    memberId: 'mem_alice',
    publicKeyFingerprint: 'y92hKZ…L0p3xA',
    mode: 'mock',
    onCopyContactCard: () => console.log('copy contact card'),
  },
} satisfies Meta<typeof IdentityCard>

export default meta
type Story = StoryObj<typeof meta>

export const MockIdentity: Story = {}
export const KeyhiveExperimental: Story = { args: { mode: 'keyhive-experimental' } }
