import type { Meta, StoryObj } from '@storybook/react-vite'
import { MacTextField } from './MacTextField.js'

const meta = {
  title: 'Atoms/MacTextField',
  component: MacTextField,
  args: {
    label: 'Workspace Name',
    placeholder: 'Intern Guild',
    helperText: 'Used only for local bootstrap right now.',
  },
} satisfies Meta<typeof MacTextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true, value: 'Locked Guild' } }
