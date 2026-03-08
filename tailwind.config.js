/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        citizens: {
          green:        '#008555',
          'green-dark': '#006644',
          'green-mid':  '#00A86B',
          'green-light':'#E6F4EE',
          'green-pale': '#F2FAF6',
          navy:         '#003087',
          'navy-light': '#E6ECF5',
          charcoal:     '#1C1C1C',
          'gray-dark':  '#3D3D3D',
          gray:         '#6B7280',
          'gray-light': '#F4F4F4',
          border:       '#D1D5DB',
        }
      },
      fontFamily: {
        sans: ['Nunito Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 4px 0 rgba(0,0,0,0.08)',
        'card-hover':'0 4px 16px 0 rgba(0,0,0,0.12)',
        'green':    '0 4px 14px 0 rgba(0,133,85,0.25)',
      }
    }
  },
  plugins: []
}
