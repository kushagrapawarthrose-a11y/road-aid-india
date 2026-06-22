/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emergency: {
          red: '#dc2626',      // critical
          orange: '#f97316',   // moderate
          yellow: '#eab308',   // minor/warning
          green: '#22c55e',    // resolved/safe
          blue: '#2563eb',     // ambulance dispatched
          teal: '#0d9488',     // clinical primary
        },
        darkBg: '#0f172a',
        darkCard: '#1e293b',
      },
    },
  },
  plugins: [],
}
