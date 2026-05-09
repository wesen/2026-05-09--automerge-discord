import type { Preview } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon'
import '../src/index.css'

initialize({ onUnhandledRequest: 'bypass' })

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    backgrounds: {
      default: 'Mac monochrome',
      values: [{ name: 'Mac monochrome', value: '#bdbdbd' }],
    },
  },
  loaders: [mswLoader],
}

export default preview
