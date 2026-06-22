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
        /* ── Marksio v7 named primitives ── */
        'ink':       'var(--ink)',
        'paper':     'var(--paper)',
        'signal':    'var(--signal)',
        'deep-teal': 'var(--deep-teal)',

        /* ── Marksio semantic tokens — auto light/dark ── */
        'bg':        'var(--bg)',
        'surface':   'var(--surface)',
        's2':        'var(--surface-2)',
        's3':        'var(--surface-3)',
        't1':        'var(--text-1)',
        't2':        'var(--text-2)',
        't3':        'var(--text-3)',
        'b':         'var(--border)',
        'b2':        'var(--border-2)',
        'b3':        'var(--border-3)',
        'primary':   'var(--primary)',
        'success':   'var(--success)',
        'warning':   'var(--warning)',
        'danger':    'var(--danger)',
        'violet':    'var(--violet)',

        /* ── shadcn compat ── */
        foreground: 'hsl(var(--foreground))',
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
        border: 'hsl(var(--border-hsl))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',

        skeleton: 'var(--surface-2)',
      },

      fontFamily: {
        sans:         ['Inter', 'system-ui', 'sans-serif'],
        body:         ['Inter', 'system-ui', 'sans-serif'],
        /* Plus Jakarta Sans — display/headline font per brief */
        display:      ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        headline:     ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono:         ['"JetBrains Mono"', 'monospace'],
        'body-md':    ['Inter', 'system-ui', 'sans-serif'],
        'body-lg':    ['Inter', 'system-ui', 'sans-serif'],
        'label-md':   ['Inter', 'system-ui', 'sans-serif'],
        'label-sm':   ['Inter', 'system-ui', 'sans-serif'],
        'title-lg':   ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        'display-lg': ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        'headline-md':['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        'headline-lg':['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        /* Brief tip skalası */
        'h1':          ['2.25rem',  { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h2':          ['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3':          ['1.125rem', { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-base':   ['0.9375rem',{ lineHeight: '1.5',  fontWeight: '400' }],
        'caption':     ['0.8125rem',{ lineHeight: '1.4',  fontWeight: '500' }],
        'data':        ['0.875rem', { lineHeight: '1.2',  fontWeight: '400' }],
        /* Legacy scale */
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
        sm:  '6px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
        '2xl': '20px',
        full: '9999px',
      },

      boxShadow: {
        /* Marksio v7 — ink-colored, not generic black */
        'card':         '0 1px 2px rgba(13,20,17,0.04), 0 4px 12px rgba(13,20,17,0.03)',
        'card-hover':   '0 2px 4px rgba(13,20,17,0.06), 0 8px 20px rgba(13,20,17,0.05)',
        'panel':        '0 4px 16px rgba(13,20,17,0.06)',
        'modal':        '0 20px 60px rgba(13,20,17,0.10)',
        /* Legacy compat */
        'glow-sm':      '0 0 15px rgba(201,138,62,0.15)',
        'glow-md':      '0 0 30px rgba(201,138,62,0.20)',
        'glow-lg':      '0 0 50px rgba(201,138,62,0.25)',
        'glow-signal':  '0 0 20px rgba(201,138,62,0.30)',
        'inner-top':    'inset 0 1px 0 rgba(255,255,255,0.06)',
        'btn-primary':  'inset 0 1px 0 rgba(255,255,255,0.20), 0 0 20px rgba(201,138,62,0.25)',
      },

      animation: {
        'fade-in':          'fadeIn 0.2s ease-out',
        'slide-up':         'slideUp 0.2s ease-out',
        'pulse-slow':       'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-core':       'pulseCore 4s ease-in-out infinite',
        'float':            'float 6s ease-in-out infinite',
        'shimmer':          'shimmer 2s infinite',
        'spin-slow':        'spin 12s linear infinite',
        'spin-slow-reverse':'spin 16s linear infinite reverse',
        'pulse-sweep':      'pulseSweep 2.5s ease-in-out infinite',
        'pulse-ping':       'pulsePing 0.65s ease-out forwards',
        'ripple':           'ripple 2s ease calc(var(--i,0)*0.2s) infinite',
        'orbit':            'orbit calc(var(--duration)*1s) linear infinite',
      },

      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
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
        pulseSweep: {
          '0%':   { backgroundPosition: '180% 0' },
          '100%': { backgroundPosition: '-80% 0' },
        },
        pulsePing: {
          '0%':   { transform: 'scaleX(0)', transformOrigin: 'left', opacity: '1' },
          '60%':  { transform: 'scaleX(1)', transformOrigin: 'left', opacity: '1' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left', opacity: '0' },
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
        'margin-desktop': '32px',
        'container-max':  '1440px',
        'unit':           '4px',
      },
    },
  },
  plugins: [],
}
