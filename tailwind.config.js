/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Marksio Design System (mockup-aligned) ── */
        'background':                '#050505',
        'surface-dim':               '#050505',
        'surface':                   '#131313',
        'surface-bright':            '#353534',
        'surface-container-lowest':  '#0e0e0e',
        'surface-container-low':     '#1c1b1b',
        'surface-container':         '#201f1f',
        'surface-container-high':    '#2a2a2a',
        'surface-container-highest': '#353534',
        'on-surface':                '#e5e2e1',
        'on-surface-variant':        '#c2c6d8',
        'inverse-surface':           '#e5e2e1',
        'inverse-on-surface':        '#313030',
        'outline':                   '#8c90a1',
        'outline-variant':           '#424656',
        'surface-tint':              '#b3c5ff',
        'primary':                   '#b3c5ff',
        'on-primary':                '#002b75',
        'primary-container':         '#0066ff',
        'on-primary-container':      '#f8f7ff',
        'inverse-primary':           '#0054d6',
        'primary-fixed':             '#dae1ff',
        'primary-fixed-dim':         '#b3c5ff',
        'on-primary-fixed':          '#001849',
        'on-primary-fixed-variant':  '#003fa4',
        /* ── Cyan accent (mockup secondary-container) ── */
        'secondary':                 '#ddfcff',
        'secondary-container':       '#00f1fe',
        'on-secondary':              '#00363a',
        'on-secondary-container':    '#006a70',
        'secondary-fixed':           '#74f5ff',
        'secondary-fixed-dim':       '#00dbe7',
        'on-secondary-fixed':        '#002022',
        'on-secondary-fixed-variant':'#004f54',
        'tertiary':                  '#c5c5d1',
        'tertiary-container':        '#70717c',
        'on-tertiary':               '#2e3039',
        'on-tertiary-container':     '#f8f7ff',
        'tertiary-fixed':            '#e2e1ee',
        'tertiary-fixed-dim':        '#c5c5d1',
        'on-tertiary-fixed':         '#191b24',
        'on-tertiary-fixed-variant': '#454650',
        'error':                     '#ffb4ab',
        'on-error':                  '#690005',
        'error-container':           '#93000a',
        'on-error-container':        '#ffdad6',
        'surface-variant':           '#353534',
        'on-background':             '#e5e2e1',

        /* ── shadcn tokens (kept for compatibility) ── */
        foreground:   'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',

        /* ── Legacy brand ── */
        brand: {
          50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD',
          400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9',
          800: '#5B21B6', 900: '#4C1D95',
        },
        skeleton: '#1e1e1e',
      },

      fontFamily: {
        sans:         ['Inter', 'system-ui', 'sans-serif'],
        body:         ['Inter', 'system-ui', 'sans-serif'],
        headline:     ['Inter', 'system-ui', 'sans-serif'],
        mono:         ['JetBrains Mono', 'monospace'],
        'body-md':    ['Inter', 'system-ui', 'sans-serif'],
        'body-lg':    ['Inter', 'system-ui', 'sans-serif'],
        'label-md':   ['Inter', 'system-ui', 'sans-serif'],
        'label-sm':   ['Inter', 'system-ui', 'sans-serif'],
        'title-lg':   ['Inter', 'system-ui', 'sans-serif'],
        'display-lg': ['Inter', 'system-ui', 'sans-serif'],
        'headline-md':['Inter', 'system-ui', 'sans-serif'],
        'headline-lg':['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-lg':  ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'title-lg':    ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'body-lg':     ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md':     ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md':    ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
        'label-sm':    ['10px', { lineHeight: '12px', letterSpacing: '0.08em', fontWeight: '600' }],
      },

      borderRadius: {
        DEFAULT: '0.5rem',
        sm:  '0.25rem',
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        xl:  '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },

      boxShadow: {
        card:          '0 1px 3px rgba(0,0,0,.5), 0 1px 2px -1px rgba(0,0,0,.5)',
        'card-hover':  '0 4px 12px rgba(0,0,0,.6)',
        'glow-sm':     '0 0 15px rgba(0,241,254,0.15)',
        'glow-md':     '0 0 30px rgba(0,241,254,0.2)',
        'glow-lg':     '0 0 50px rgba(0,241,254,0.25)',
        'glow-cyan':   '0 0 15px rgba(0,241,254,0.3)',
        'glow-blue':   '0 0 20px rgba(0,102,255,0.3)',
        'inner-top':   'inset 0 1px 0 rgba(255,255,255,0.06)',
        'btn-primary': 'inset 0 1px 0 rgba(255,255,255,0.25), 0 0 20px rgba(0,102,255,0.3)',
        'panel':       '-10px 0 30px rgba(0,0,0,0.4)',
      },

      animation: {
        'fade-in':          'fadeIn 0.4s ease-out',
        'slide-up':         'slideUp 0.4s ease-out',
        'pulse-slow':       'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-core':       'pulseCore 4s ease-in-out infinite',
        'float':            'float 6s ease-in-out infinite',
        'shimmer':          'shimmer 2s infinite',
        'spin-slow':        'spin 12s linear infinite',
        'spin-slow-reverse':'spin 16s linear infinite reverse',
        'ripple':           'ripple 2s ease calc(var(--i,0)*0.2s) infinite',
        'orbit':            'orbit calc(var(--duration)*1s) linear infinite',
      },

      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseCore: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.6', filter: 'blur(8px)' },
          '50%':      { transform: 'scale(1.15)', opacity: '1',   filter: 'blur(16px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        ripple: {
          '0%, 100%': { transform: 'translate(-50%,-50%) scale(1)' },
          '50%':      { transform: 'translate(-50%,-50%) scale(0.9)' },
        },
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateY(calc(var(--radius)*1px)) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateY(calc(var(--radius)*1px)) rotate(-360deg)' },
        },
      },

      spacing: {
        'gutter':         '24px',
        'margin-mobile':  '16px',
        'margin-desktop': '48px',
        'container-max':  '1440px',
        'unit':           '4px',
      },
    },
  },
  plugins: [],
}
