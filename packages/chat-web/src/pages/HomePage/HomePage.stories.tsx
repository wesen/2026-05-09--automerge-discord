import type { Meta, StoryObj } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'
import { Provider } from 'react-redux'
import { store } from '../../app/store.js'
import { HomePageContent } from './HomePage.js'

const meta = {
  title: 'Pages/HomePage',
  component: HomePageContent,
  decorators: [(Story) => <Provider store={store}><Story /></Provider>],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        http.post('/api/bootstrap/workspaces', async () => HttpResponse.json({
          workspaceId: 'wk_storybook',
          workspaceDocUrl: 'automerge:storybookWorkspace',
          syncUrl: 'ws://localhost:3030/sync',
        }, { status: 201 })),
      ],
    },
  },
} satisfies Meta<typeof HomePageContent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const BootstrapFails: Story = {
  parameters: {
    msw: {
      handlers: [http.post('/api/bootstrap/workspaces', () => HttpResponse.json({ error: 'offline' }, { status: 503 }))],
    },
  },
}
