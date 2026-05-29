import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#b08d4e',
          light: '#d4b478',
          dark: '#836a3a',
          pale: '#d4b478',
          deep: '#836a3a',
        },
        ember: {
          DEFAULT: '#b3461a',
          deep: '#7d2f10',
        },
        burgundy: {
          DEFAULT: '#6b2a2a',
          deep: '#401717',
        },
        arcane: {
          DEFAULT: '#5a8e94',
          deep: '#2f5a60',
        },
        verdigris: '#4a6b53',
        parchment: {
          DEFAULT: '#cdc1a6',
          bright: '#e6dcc4',
        },
        'dnd-red': {
          DEFAULT: '#8B0000',
          light: '#A52A2A',
          dark: '#5C0000',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'var(--radius)',
        sm: 'var(--radius)',
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        serif: ['Cormorant Garamond', 'Garamond', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
