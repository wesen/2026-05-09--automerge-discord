import type { Meta, StoryObj } from '@storybook/react-vite'
import { MacButton } from './MacButton.js'

const meta = {
  title: 'Atoms/MacButton',
  component: MacButton,
  args: {
    children: 'Create',
    variant: 'primary',
    compact: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger'] },
  },
} satisfies Meta<typeof MacButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
  args: { children: 'Cancel', variant: 'secondary' },
}

export const Danger: Story = {
  args: { children: 'Delete', variant: 'danger' },
}
