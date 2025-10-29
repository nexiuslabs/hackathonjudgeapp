import { describe, expect, it } from 'vitest';

import { brandKeys, tailwindTheme, themeTokens } from '@/config/theme-tokens';

describe('theme tokens', () => {
  it('exports a consistent brand palette', () => {
    expect(brandKeys).toMatchInlineSnapshot(`
      [
        "50",
        "100",
        "200",
        "300",
        "400",
        "500",
        "600",
        "700",
        "800",
        "900",
      ]
    `);
  });

  it('shares palette scales with tailwind config', () => {
    expect(Object.keys(tailwindTheme.colors.brand)).toEqual(Object.keys(themeTokens.colors.brand));
    expect(Object.keys(tailwindTheme.colors.neutral)).toEqual(Object.keys(themeTokens.colors.neutral));
  });

  it('keeps spacing tokens in sync', () => {
    expect(tailwindTheme.spacing).toEqual(themeTokens.spacing);
  });

  it('provides semantic colors for runtime use', () => {
    expect(themeTokens.colors.semantic).toMatchObject({
      info: expect.stringMatching(/^#/),
      success: expect.stringMatching(/^#/),
      warning: expect.stringMatching(/^#/),
      danger: expect.stringMatching(/^#/),
    });
  });
});
