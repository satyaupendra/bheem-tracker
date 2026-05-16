/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blue: { 10: '#e8f0fd', 50: '#7aaaff', 100: '#0053e2', 110: '#0044c0', 140: '#002d80' },
        spark: { 10: '#fff8e0', 50: '#ffe47a', 100: '#ffc220', 140: '#995213' },
        green: { 10: '#eaf4e4', 100: '#2a8703', 110: '#227002' },
        red: { 10: '#fde8e6', 100: '#ea1100' },
        gray: { 10: '#f5f5f5', 50: '#d9d9d9', 100: '#767676', 160: '#1a1a1a' }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' }
    }
  },
  plugins: []
}
