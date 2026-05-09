import type { Meta, StoryObj } from '@storybook/react-vite'
import { MacPanel } from './MacPanel.js'

const meta = {
  title: 'Atoms/MacPanel',
  component: MacPanel,
  args: {
    title: 'System Note',
    children: 'This panel uses Mac OS 1 inspired inset borders and monochrome surfaces.',
    inset: false,
  },
} satisfies Meta<typeof MacPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Raised: Story = {}
export const Inset: Story = { args: { inset: true, title: 'Transcript' } }
