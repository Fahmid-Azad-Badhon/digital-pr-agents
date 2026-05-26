import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          soft: '#EFF6FF',
          dark: '#60A5FA',
          darkHover: '#3B82F6',
          darkSoft: '#1E3A8A',
        },
        nav: {
          bg: '#0F172A',
          hover: '#1F2937',
          darkBg: '#0F172A',
          darkHover: '#1E293B',
        },
        surface: {
          DEFAULT: '#1E293B',
          dark: '#273449',
          light: '#F1F5F9',
        },
        success: {
          DEFAULT: '#22C55E',
          soft: '#14532D',
        },
        warning: {
          DEFAULT: '#FBBF24',
          soft: '#78350F',
        },
        error: {
          DEFAULT: '#F87171',
          soft: '#7F1D1D',
        },
        info: {
          DEFAULT: '#60A5FA',
          soft: '#1E3A8A',
        },
        manual: {
          DEFAULT: '#A78BFA',
          soft: '#4C1D95',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config