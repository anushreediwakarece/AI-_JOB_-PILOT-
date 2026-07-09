import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          secondary: 'var(--color-surface-secondary)',
          tertiary: 'var(--color-surface-tertiary)',
          muted: 'var(--color-surface-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
          muted: 'var(--color-border-muted)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          dark: 'var(--color-text-dark)',
          darker: 'var(--color-text-darker)',
          darkest: 'var(--color-text-darkest)',
          black: 'var(--color-text-black)',
          slate: {
            DEFAULT: 'var(--color-text-slate)',
            medium: 'var(--color-text-slate-medium)',
          }
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          dark: 'var(--color-accent-dark)',
          light: 'var(--color-accent-light)',
          muted: 'var(--color-accent-muted)',
          foreground: 'var(--color-accent-foreground)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          alt: 'var(--color-success-alt)',
          dark: 'var(--color-success-dark)',
          darker: 'var(--color-success-darker)',
          light: 'var(--color-success-light)',
          lightest: 'var(--color-success-lightest)',
          foreground: 'var(--color-success-foreground)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          dark: 'var(--color-info-dark)',
          medium: 'var(--color-info-medium)',
          light: 'var(--color-info-light)',
          lightest: 'var(--color-info-lightest)',
          foreground: 'var(--color-info-foreground)',
          muted: 'var(--color-info-muted)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          foreground: 'var(--color-warning-foreground)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          foreground: 'var(--color-error-foreground)',
        },
        linkedin: {
          DEFAULT: 'var(--color-linkedin)',
          light: 'var(--color-linkedin-light)',
          foreground: 'var(--color-linkedin-foreground)',
        },
        overlay: {
          DEFAULT: 'var(--color-overlay)',
          dark: 'var(--color-overlay-dark)',
        }
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      }
    },
  },
  plugins: [],
}

export default config
