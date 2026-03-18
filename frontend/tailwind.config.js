/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        cream:       '#FFFEF2',
        'cream-2':   '#F5F4E8',
        'cream-3':   '#ECEBD8',
        ink:         '#191918',
        'ink-2':     '#3A3A38',
        'ink-3':     '#6B6B67',
        'ink-4':     '#9B9B96',
        gold:        '#FCAA2D',
        'gold-dark': '#A36404',
        'gold-light':'#FEE5A8',
        divider:     'rgba(25,25,24,0.10)',

        // Dark mode
        'dark-bg':      '#0F0F0E',
        'dark-surface': '#1A1A18',
        'dark-surface-2':'#242421',
        'dark-border':  'rgba(255,254,242,0.08)',
        'dark-text':    '#FFFEF2',
        'dark-text-2':  '#B8B7AE',
        'dark-text-3':  '#6B6B67',

        // Semantic match colors (shared)
        'match-green':  '#22C55E',
        'match-yellow': '#F59E0B',
        'match-gray':   '#71717A',
      },
      fontFamily: {
        serif:  ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:   ['"Inter"', 'system-ui', 'sans-serif'],
        mono:   ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(25,25,24,0.06), 0 1px 2px rgba(25,25,24,0.04)',
        'card-hover':'0 4px 12px rgba(25,25,24,0.10), 0 2px 4px rgba(25,25,24,0.06)',
        'card-dark': '0 1px 3px rgba(0,0,0,0.3)',
        'card-dark-hover': '0 4px 12px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':   'fadeIn 0.25s ease-out',
        'slide-up':  'slideUp 0.35s ease-out',
        'slide-right':'slideRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 },                              to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(14px)'},to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(-10px)'},to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
