import tokensJson from './theme-tokens.json';

type BrandScale = typeof tokensJson.colors.brand;
type NeutralScale = typeof tokensJson.colors.neutral;

type ThemeTokens = typeof tokensJson;

export const themeTokens: ThemeTokens = tokensJson;

export const tailwindTheme = {
  colors: {
    brand: themeTokens.colors.brand,
    neutral: themeTokens.colors.neutral,
    surface: themeTokens.colors.surface,
    info: themeTokens.colors.semantic.info,
    success: themeTokens.colors.semantic.success,
    warning: themeTokens.colors.semantic.warning,
    danger: themeTokens.colors.semantic.danger,
  },
  fontFamily: themeTokens.fontFamily,
  fontSize: themeTokens.fontSize,
  borderRadius: themeTokens.radii,
  spacing: themeTokens.spacing,
  boxShadow: themeTokens.shadows,
} as const;

export const brandKeys = Object.keys(themeTokens.colors.brand) as Array<keyof BrandScale>;
export const neutralKeys = Object.keys(themeTokens.colors.neutral) as Array<keyof NeutralScale>;

export type ThemeColorToken = keyof ThemeTokens['colors'];

export const buildVersion = () =>
  (import.meta.env.VITE_APP_BUILD_VERSION as string | undefined) ?? 'dev';
