import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6AD140',
          secondary: '#3F9922',
          accent: '#9EEB70',
        },
        content: {
          primary: '#1A1D18',
          secondary: '#5E665A',
          tertiary: '#A8B09F',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F4F6F2',
          tertiary: '#FAFBF9',
        },
        border: {
          DEFAULT: '#E8EBE5',
          secondary: '#D1D6CC',
          tertiary: '#A8B09F',
        },
        status: {
          success: '#6AD140',
          'success-bg': '#F0FBE8',
          error: '#EF4444',
          'error-bg': '#FEF2F2',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6AD140 0%, #54B830 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1A1D18 0%, #2E332B 100%)',
      },
    },
  },
  plugins: [],
}

export default config