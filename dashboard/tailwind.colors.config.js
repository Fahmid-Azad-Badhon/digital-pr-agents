/**
 * Digital PR Orchestrator - Tailwind Configuration
 * Professional color system for enterprise Digital PR dashboard
 * 
 * Based on DESIGN-SYSTEM-COLORS.md
 * Use with: npm run dev or add to tailwind.config.js
 */

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // =========================================
        // PRIMARY COLORS
        // =========================================
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          soft: '#EFF6FF',
          dark: {
            DEFAULT: '#60A5FA',
            hover: '#3B82F6',
            soft: '#1E3A8A',
          },
        },

        // =========================================
        // NAVIGATION
        // =========================================
        nav: {
          bg: '#111827',
          hover: '#1F2937',
          dark: {
            bg: '#0F172A',
            hover: '#1E293B',
          },
        },

        // =========================================
        // BACKGROUND COLORS
        // =========================================
        background: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          section: '#F1F5F9',
          dark: {
            DEFAULT: '#111827',
            card: '#1E293B',
            section: '#273449',
          },
        },

        // =========================================
        // TEXT COLORS
        // =========================================
        text: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
          dark: {
            DEFAULT: '#E5E7EB',
            secondary: '#CBD5E1',
            muted: '#94A3B8',
          },
        },

        // =========================================
        // BORDER
        // =========================================
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#334155',
        },

        // =========================================
        // STATUS COLORS
        // =========================================
        success: {
          DEFAULT: '#16A34A',
          soft: '#DCFCE7',
          dark: '#22C55E',
          darkSoft: '#14532D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          soft: '#FEF3C7',
          dark: '#FBBF24',
          darkSoft: '#78350F',
        },
        error: {
          DEFAULT: '#DC2626',
          soft: '#FEE2E2',
          dark: '#F87171',
          darkSoft: '#7F1D1D',
        },
        info: {
          DEFAULT: '#2563EB',
          soft: '#DBEAFE',
          dark: '#60A5FA',
          darkSoft: '#1E3A8A',
        },
        manual: {
          DEFAULT: '#7C3AED',
          soft: '#EDE9FE',
          dark: '#A78BFA',
          darkSoft: '#4C1D95',
        },
        waiting: {
          DEFAULT: '#64748B',
          soft: '#F1F5F9',
          dark: '#94A3B8',
          darkSoft: '#273449',
        },

        // =========================================
        // WORKFLOW STAGE COLORS
        // =========================================
        stage: {
          intake: '#4F46E5',       // Campaign Intake
          extraction: '#2563EB',    // Study Extraction
          research: '#0891B2',      // Research Enrichment
          angles: '#7C3AED',        // Angle Generation
          beats: '#9333EA',        // Beat Matching + Outreach Gate (CRITICAL)
          collection: '#0D9488',   // Journalist Collection
          intelligence: '#059669', // Journalist Intelligence
          draft: '#E11D48',        // Pitch Drafting
          optimize: '#EA580C',      // Email Optimization
          package: '#D97706',      // Final Packaging
          export: '#16A34A',       // Google Doc Export
          validation: '#475569',   // Technical Validation
          browser: '#0284C7',     // Browser/Search Validation
          readiness: '#52525B',   // Production Readiness
        },

        // =========================================
        // CHART COLORS
        // =========================================
        chart: {
          1: '#3B82F6',
          2: '#10B981',
          3: '#F59E0B',
          4: '#F43F5E',
          5: '#8B5CF6',
          6: '#14B8A6',
          // Dark mode variants
          dark1: '#60A5FA',
          dark2: '#34D399',
          dark3: '#FBBF24',
          dark4: '#FB7185',
          dark5: '#A78BFA',
          dark6: '#2DD4BF',
        },

        // =========================================
        // SLATE SCALE (for neutrals)
        // =========================================
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },

      // =========================================
      // SHADOWS
      // =========================================
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        glow: {
          primary: '0 0 20px rgba(37, 99, 235, 0.3)',
          success: '0 0 20px rgba(22, 163, 74, 0.3)',
          warning: '0 0 20px rgba(245, 158, 11, 0.3)',
          error: '0 0 20px rgba(220, 38, 38, 0.3)',
          manual: '0 0 20px rgba(124, 58, 237, 0.3)',
        },
      },

      // =========================================
      // BORDER RADIUS
      // =========================================
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}