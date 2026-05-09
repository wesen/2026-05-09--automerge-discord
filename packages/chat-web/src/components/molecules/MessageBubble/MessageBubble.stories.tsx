import type { Meta, StoryObj } from '@storybook/react-vite'
import { fixtureMessages } from '../../../shared/fixtures.js'
import { MessageBubble } from './MessageBubble.js'

const meta = {
  title: 'Molecules/MessageBubble',
  component: MessageBubble,
  args: {
    message: fixtureMessages[0],
    authorName: 'Alice',
    own: false,
  },
} satisfies Meta<typeof MessageBubble>

export default meta
type Story = StoryObj<typeof meta>

export const Incoming: Story = {}
export const Own: Story = { args: { own: true, authorName: 'You' } }
export const LongText: Story = {
  args: {
    message: { ...fixtureMessages[1], body: 'A long monochrome message wraps through the timeline without window chrome, menu bars, gradients, or modern glass effects. The surface should still feel tactile through one-pixel borders.' },
    authorName: 'Bob',
  },
}
