import type { Meta, StoryObj } from '@storybook/react-vite'
import { Composer } from './Composer.js'

const meta = {
  title: 'Molecules/Composer',
  component: Composer,
  args: {
    placeholder: 'Ask the helper bot…',
    onSend: (body: string) => console.log('send', body),
  },
} satisfies Meta<typeof Composer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
