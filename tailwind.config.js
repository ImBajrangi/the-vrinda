/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          top: '#E3EFE9',
          mid: '#D5E6DA',
          sage: '#9DB596',
          dark: '#1F4D12'
        },
        peach: {
          glow: '#F7E6D2',
        },
        surface: {
          card: '#F4F4F4',
          cardAlt: '#F8F8F8',
          glass: 'rgba(255, 255, 255, 0.70)',
        },
        sacred: {
          kesar: '#C85A32',
          gold: '#D4A359',
          ink: '#14213D',
          tulsi: '#22C55E',
          lime: '#B6FF2E',
          red: '#EF4444',
          subtle: '#6B6F6B',
        }
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        doto: ['"Plus Jakarta Sans"', 'monospace'],
        laila: ['"Laila"', '"Noto Serif Devanagari"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'serif'],
        rozha: ['"Rozha One"', '"Laila"', '-apple-system', 'BlinkMacSystemFont', 'serif'],
        display: ['"Rozha One"', '"Laila"', 'serif'],
        devanagari: ['"Laila"', '"Noto Serif Devanagari"', '-apple-system', 'BlinkMacSystemFont', 'serif'],
        serif: ['"Laila"', '"Noto Serif Devanagari"', '-apple-system', 'BlinkMacSystemFont', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        native: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'card': '0 8px 24px rgba(0, 0, 0, 0.04)',
        'nav': '0 12px 32px rgba(0, 0, 0, 0.08)',
        'fab': '0 10px 25px rgba(31, 77, 18, 0.25)',
      }
    },
  },
  plugins: [],
}

