/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        retro: ['ChicagoFLF', 'Chicago', 'Geneva', 'Monaco', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        mac: 'inset 1px 1px 0 #ffffff, inset -1px -1px 0 #6b6b6b',
        'mac-pressed': 'inset 1px 1px 0 #6b6b6b, inset -1px -1px 0 #ffffff',
      },
    },
  },
  plugins: [],
}
