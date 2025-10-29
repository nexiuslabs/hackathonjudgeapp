import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const themeTokens = require('./src/config/theme-tokens.json');

const parseFontStack = (value) =>
  value
    .split(',')
    .map((token) => token.trim().replace(/^'|'$/g, ''))
    .filter(Boolean);

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: themeTokens.colors.brand,
        neutral: themeTokens.colors.neutral,
        surface: {
          base: themeTokens.colors.surface.base,
          muted: themeTokens.colors.surface.muted,
          elevated: themeTokens.colors.surface.elevated,
          overlay: themeTokens.colors.surface.overlay,
          border: themeTokens.colors.surface.border,
          highlight: themeTokens.colors.surface.highlight,
        },
        info: themeTokens.colors.semantic.info,
        success: themeTokens.colors.semantic.success,
        warning: themeTokens.colors.semantic.warning,
        danger: themeTokens.colors.semantic.danger,
      },
      fontFamily: {
        sans: parseFontStack(themeTokens.fontFamily.sans),
        mono: parseFontStack(themeTokens.fontFamily.mono),
      },
      fontSize: themeTokens.fontSize,
      borderRadius: themeTokens.radii,
      spacing: themeTokens.spacing,
      boxShadow: {
        subtle: themeTokens.shadows.sm,
        layered: themeTokens.shadows.md,
        elevated: themeTokens.shadows.xl,
      },
      backdropBlur: {
        shell: '18px',
      },
    },
  },
  plugins: [],
};
