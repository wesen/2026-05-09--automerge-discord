import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusPill } from './StatusPill.js'

const meta = {
  title: 'Atoms/StatusPill',
  component: StatusPill,
  args: { tone: 'ok', children: 'synced' },
  argTypes: { tone: { control: 'inline-radio', options: ['idle', 'ok', 'warn', 'error'] } },
} satisfies Meta<typeof StatusPill>

export default meta
type Story = StoryObj<typeof meta>

export const Ok: Story = {}
export const Warning: Story = { args: { tone: 'warn', children: 'offline' } }
export const Error: Story = { args: { tone: 'error', children: 'failed' } }
