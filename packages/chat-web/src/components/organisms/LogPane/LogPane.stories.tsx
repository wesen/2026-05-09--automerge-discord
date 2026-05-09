import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { LogPane, type LogEntry } from './LogPane.js'

const entries: LogEntry[] = [
  { id: '1', at: '2026-05-09T17:40:00Z', level: 'ok', message: 'Workspace ready', detail: 'automerge:storyWorkspace' },
  { id: '2', at: '2026-05-09T17:39:58Z', level: 'info', message: 'Opening workspace through relay' },
  { id: '3', at: '2026-05-09T17:39:50Z', level: 'warn', message: 'Using fixture fallback before workspace opened' },
]

const meta = {
  title: 'Organisms/LogPane',
  component: LogPane,
  args: { entries, open: true, onToggle: () => undefined, onClear: () => undefined },
  render: (args) => {
    const [open, setOpen] = useState(args.open)
    return <LogPane {...args} open={open} onToggle={() => setOpen((value) => !value)} onClear={() => console.log('clear logs')} />
  },
} satisfies Meta<typeof LogPane>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {}
export const Collapsed: Story = { args: { open: false } }
export const Empty: Story = { args: { entries: [] } }
