/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9FAFB',
        card: '#FFFFFF',
        primary: {
          DEFAULT: '#22C55E', // green accent
          foreground: '#FFFFFF',
        },
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: `var(--radius, 0.5rem)`,
        md: `calc(var(--radius, 0.5rem) - 2px)`,
        sm: `calc(var(--radius, 0.5rem) - 4px)`,
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
