// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { VitePWA } from "file:///home/project/node_modules/vite-plugin-pwa/dist/index.js";

// src/config/theme-tokens.json
var theme_tokens_default = {
  colors: {
    brand: {
      "50": "#eef2ff",
      "100": "#e0e7ff",
      "200": "#c7d2fe",
      "300": "#a5b4fc",
      "400": "#818cf8",
      "500": "#6366f1",
      "600": "#4f46e5",
      "700": "#4338ca",
      "800": "#3730a3",
      "900": "#312e81"
    },
    neutral: {
      "50": "#f8fafc",
      "100": "#f1f5f9",
      "200": "#e2e8f0",
      "300": "#cbd5f5",
      "400": "#94a3b8",
      "500": "#64748b",
      "600": "#475569",
      "700": "#334155",
      "800": "#1e293b",
      "900": "#0f172a"
    },
    surface: {
      base: "#050816",
      muted: "#0b1120",
      elevated: "#131b2f",
      overlay: "rgba(10, 15, 27, 0.88)",
      border: "rgba(148, 163, 184, 0.24)",
      highlight: "rgba(99, 102, 241, 0.18)"
    },
    semantic: {
      info: "#38bdf8",
      success: "#22c55e",
      warning: "#facc15",
      danger: "#f87171"
    }
  },
  fontFamily: {
    sans: "'Inter', 'SF Pro Text', 'system-ui', 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace"
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem"
  },
  radii: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    full: "9999px"
  },
  spacing: {
    "3xs": "0.25rem",
    "2xs": "0.375rem",
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "2.5rem",
    "3xl": "3rem"
  },
  shadows: {
    sm: "0 1px 2px rgba(15, 23, 42, 0.14)",
    md: "0 10px 30px rgba(15, 23, 42, 0.22)",
    xl: "0 30px 60px rgba(15, 23, 42, 0.25)"
  }
};

// src/config/theme-tokens.ts
var themeTokens = theme_tokens_default;
var tailwindTheme = {
  colors: {
    brand: themeTokens.colors.brand,
    neutral: themeTokens.colors.neutral,
    surface: themeTokens.colors.surface,
    info: themeTokens.colors.semantic.info,
    success: themeTokens.colors.semantic.success,
    warning: themeTokens.colors.semantic.warning,
    danger: themeTokens.colors.semantic.danger
  },
  fontFamily: themeTokens.fontFamily,
  fontSize: themeTokens.fontSize,
  borderRadius: themeTokens.radii,
  spacing: themeTokens.spacing,
  boxShadow: themeTokens.shadows
};
var brandKeys = Object.keys(themeTokens.colors.brand);
var neutralKeys = Object.keys(themeTokens.colors.neutral);

// src/config/app-metadata.ts
var appMetadata = {
  name: "Hackathon Judge",
  shortName: "Judge",
  description: "Coordinate judging assignments, capture scores, and stay aligned with the hackathon brief\u2014online or offline.",
  themeColor: themeTokens.colors.brand[600],
  backgroundColor: themeTokens.colors.surface.base,
  offlineSnapshotName: "offline-brief"
};

// vite.config.ts
var __vite_injected_original_import_meta_url = "file:///home/project/vite.config.ts";
var buildVersion = process.env.BUILD_VERSION ?? (/* @__PURE__ */ new Date()).toISOString();
var offlineSnapshotPattern = new RegExp(
  String.raw`/${appMetadata.offlineSnapshotName}\.json$`
);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["/icons/app-icon.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: `shell-assets-${buildVersion}`,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
                // 30 days
              }
            }
          },
          {
            urlPattern: offlineSnapshotPattern,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: `offline-brief-${buildVersion}`,
              expiration: {
                maxEntries: 1
              }
            }
          }
        ]
      },
      manifest: {
        name: appMetadata.name,
        short_name: appMetadata.shortName,
        description: appMetadata.description,
        theme_color: appMetadata.themeColor,
        background_color: appMetadata.backgroundColor,
        start_url: "/brief",
        display: "standalone",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/icons/app-icon.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "/icons/app-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion)
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL2NvbmZpZy90aGVtZS10b2tlbnMuanNvbiIsICJzcmMvY29uZmlnL3RoZW1lLXRva2Vucy50cyIsICJzcmMvY29uZmlnL2FwcC1tZXRhZGF0YS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL3Byb2plY3RcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJztcblxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbmltcG9ydCB7IGFwcE1ldGFkYXRhIH0gZnJvbSAnLi9zcmMvY29uZmlnL2FwcC1tZXRhZGF0YSc7XG5cbmNvbnN0IGJ1aWxkVmVyc2lvbiA9IHByb2Nlc3MuZW52LkJVSUxEX1ZFUlNJT04gPz8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuY29uc3Qgb2ZmbGluZVNuYXBzaG90UGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gIFN0cmluZy5yYXdgLyR7YXBwTWV0YWRhdGEub2ZmbGluZVNuYXBzaG90TmFtZX1cXC5qc29uJGAsXG4pO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgaW5qZWN0UmVnaXN0ZXI6ICdhdXRvJyxcbiAgICAgIGluY2x1ZGVBc3NldHM6IFsnL2ljb25zL2FwcC1pY29uLnN2ZyddLFxuICAgICAgd29ya2JveDoge1xuICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd2VibWFuaWZlc3R9J10sXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogKHsgdXJsIH0pID0+IHVybC5wYXRobmFtZS5zdGFydHNXaXRoKCcvYXNzZXRzLycpLFxuICAgICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6IGBzaGVsbC1hc3NldHMtJHtidWlsZFZlcnNpb259YCxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDYwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwLCAvLyAzMCBkYXlzXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogb2ZmbGluZVNuYXBzaG90UGF0dGVybixcbiAgICAgICAgICAgIGhhbmRsZXI6ICdTdGFsZVdoaWxlUmV2YWxpZGF0ZScsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogYG9mZmxpbmUtYnJpZWYtJHtidWlsZFZlcnNpb259YCxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogYXBwTWV0YWRhdGEubmFtZSxcbiAgICAgICAgc2hvcnRfbmFtZTogYXBwTWV0YWRhdGEuc2hvcnROYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogYXBwTWV0YWRhdGEuZGVzY3JpcHRpb24sXG4gICAgICAgIHRoZW1lX2NvbG9yOiBhcHBNZXRhZGF0YS50aGVtZUNvbG9yLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBhcHBNZXRhZGF0YS5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgIHN0YXJ0X3VybDogJy9icmllZicsXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdC1wcmltYXJ5JyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvaWNvbnMvYXBwLWljb24uc3ZnJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2Uvc3ZnK3htbCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvaWNvbnMvYXBwLWljb24uc3ZnJyxcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2Uvc3ZnK3htbCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBkZXZPcHRpb25zOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgZGVmaW5lOiB7XG4gICAgX19CVUlMRF9WRVJTSU9OX186IEpTT04uc3RyaW5naWZ5KGJ1aWxkVmVyc2lvbiksXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgc2V0dXBGaWxlczogJy4vc3JjL3Rlc3Qvc2V0dXAudHMnLFxuICAgIGNzczogdHJ1ZSxcbiAgfSxcbn0pO1xuIiwgIntcbiAgXCJjb2xvcnNcIjoge1xuICAgIFwiYnJhbmRcIjoge1xuICAgICAgXCI1MFwiOiBcIiNlZWYyZmZcIixcbiAgICAgIFwiMTAwXCI6IFwiI2UwZTdmZlwiLFxuICAgICAgXCIyMDBcIjogXCIjYzdkMmZlXCIsXG4gICAgICBcIjMwMFwiOiBcIiNhNWI0ZmNcIixcbiAgICAgIFwiNDAwXCI6IFwiIzgxOGNmOFwiLFxuICAgICAgXCI1MDBcIjogXCIjNjM2NmYxXCIsXG4gICAgICBcIjYwMFwiOiBcIiM0ZjQ2ZTVcIixcbiAgICAgIFwiNzAwXCI6IFwiIzQzMzhjYVwiLFxuICAgICAgXCI4MDBcIjogXCIjMzczMGEzXCIsXG4gICAgICBcIjkwMFwiOiBcIiMzMTJlODFcIlxuICAgIH0sXG4gICAgXCJuZXV0cmFsXCI6IHtcbiAgICAgIFwiNTBcIjogXCIjZjhmYWZjXCIsXG4gICAgICBcIjEwMFwiOiBcIiNmMWY1ZjlcIixcbiAgICAgIFwiMjAwXCI6IFwiI2UyZThmMFwiLFxuICAgICAgXCIzMDBcIjogXCIjY2JkNWY1XCIsXG4gICAgICBcIjQwMFwiOiBcIiM5NGEzYjhcIixcbiAgICAgIFwiNTAwXCI6IFwiIzY0NzQ4YlwiLFxuICAgICAgXCI2MDBcIjogXCIjNDc1NTY5XCIsXG4gICAgICBcIjcwMFwiOiBcIiMzMzQxNTVcIixcbiAgICAgIFwiODAwXCI6IFwiIzFlMjkzYlwiLFxuICAgICAgXCI5MDBcIjogXCIjMGYxNzJhXCJcbiAgICB9LFxuICAgIFwic3VyZmFjZVwiOiB7XG4gICAgICBcImJhc2VcIjogXCIjMDUwODE2XCIsXG4gICAgICBcIm11dGVkXCI6IFwiIzBiMTEyMFwiLFxuICAgICAgXCJlbGV2YXRlZFwiOiBcIiMxMzFiMmZcIixcbiAgICAgIFwib3ZlcmxheVwiOiBcInJnYmEoMTAsIDE1LCAyNywgMC44OClcIixcbiAgICAgIFwiYm9yZGVyXCI6IFwicmdiYSgxNDgsIDE2MywgMTg0LCAwLjI0KVwiLFxuICAgICAgXCJoaWdobGlnaHRcIjogXCJyZ2JhKDk5LCAxMDIsIDI0MSwgMC4xOClcIlxuICAgIH0sXG4gICAgXCJzZW1hbnRpY1wiOiB7XG4gICAgICBcImluZm9cIjogXCIjMzhiZGY4XCIsXG4gICAgICBcInN1Y2Nlc3NcIjogXCIjMjJjNTVlXCIsXG4gICAgICBcIndhcm5pbmdcIjogXCIjZmFjYzE1XCIsXG4gICAgICBcImRhbmdlclwiOiBcIiNmODcxNzFcIlxuICAgIH1cbiAgfSxcbiAgXCJmb250RmFtaWx5XCI6IHtcbiAgICBcInNhbnNcIjogXCInSW50ZXInLCAnU0YgUHJvIFRleHQnLCAnc3lzdGVtLXVpJywgJ1NlZ29lIFVJJywgc2Fucy1zZXJpZlwiLFxuICAgIFwibW9ub1wiOiBcIidKZXRCcmFpbnMgTW9ubycsICdTRk1vbm8tUmVndWxhcicsICdNZW5sbycsIG1vbm9zcGFjZVwiXG4gIH0sXG4gIFwiZm9udFNpemVcIjoge1xuICAgIFwieHNcIjogXCIwLjc1cmVtXCIsXG4gICAgXCJzbVwiOiBcIjAuODc1cmVtXCIsXG4gICAgXCJiYXNlXCI6IFwiMXJlbVwiLFxuICAgIFwibGdcIjogXCIxLjEyNXJlbVwiLFxuICAgIFwieGxcIjogXCIxLjI1cmVtXCIsXG4gICAgXCIyeGxcIjogXCIxLjVyZW1cIixcbiAgICBcIjN4bFwiOiBcIjEuODc1cmVtXCJcbiAgfSxcbiAgXCJyYWRpaVwiOiB7XG4gICAgXCJzbVwiOiBcIjAuNXJlbVwiLFxuICAgIFwibWRcIjogXCIwLjc1cmVtXCIsXG4gICAgXCJsZ1wiOiBcIjFyZW1cIixcbiAgICBcInhsXCI6IFwiMS41cmVtXCIsXG4gICAgXCJmdWxsXCI6IFwiOTk5OXB4XCJcbiAgfSxcbiAgXCJzcGFjaW5nXCI6IHtcbiAgICBcIjN4c1wiOiBcIjAuMjVyZW1cIixcbiAgICBcIjJ4c1wiOiBcIjAuMzc1cmVtXCIsXG4gICAgXCJ4c1wiOiBcIjAuNXJlbVwiLFxuICAgIFwic21cIjogXCIwLjc1cmVtXCIsXG4gICAgXCJtZFwiOiBcIjFyZW1cIixcbiAgICBcImxnXCI6IFwiMS41cmVtXCIsXG4gICAgXCJ4bFwiOiBcIjJyZW1cIixcbiAgICBcIjJ4bFwiOiBcIjIuNXJlbVwiLFxuICAgIFwiM3hsXCI6IFwiM3JlbVwiXG4gIH0sXG4gIFwic2hhZG93c1wiOiB7XG4gICAgXCJzbVwiOiBcIjAgMXB4IDJweCByZ2JhKDE1LCAyMywgNDIsIDAuMTQpXCIsXG4gICAgXCJtZFwiOiBcIjAgMTBweCAzMHB4IHJnYmEoMTUsIDIzLCA0MiwgMC4yMilcIixcbiAgICBcInhsXCI6IFwiMCAzMHB4IDYwcHggcmdiYSgxNSwgMjMsIDQyLCAwLjI1KVwiXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcHJvamVjdC9zcmMvY29uZmlnXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NyYy9jb25maWcvdGhlbWUtdG9rZW5zLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvc3JjL2NvbmZpZy90aGVtZS10b2tlbnMudHNcIjtpbXBvcnQgdG9rZW5zSnNvbiBmcm9tICcuL3RoZW1lLXRva2Vucy5qc29uJztcblxudHlwZSBCcmFuZFNjYWxlID0gdHlwZW9mIHRva2Vuc0pzb24uY29sb3JzLmJyYW5kO1xudHlwZSBOZXV0cmFsU2NhbGUgPSB0eXBlb2YgdG9rZW5zSnNvbi5jb2xvcnMubmV1dHJhbDtcblxudHlwZSBUaGVtZVRva2VucyA9IHR5cGVvZiB0b2tlbnNKc29uO1xuXG5leHBvcnQgY29uc3QgdGhlbWVUb2tlbnM6IFRoZW1lVG9rZW5zID0gdG9rZW5zSnNvbjtcblxuZXhwb3J0IGNvbnN0IHRhaWx3aW5kVGhlbWUgPSB7XG4gIGNvbG9yczoge1xuICAgIGJyYW5kOiB0aGVtZVRva2Vucy5jb2xvcnMuYnJhbmQsXG4gICAgbmV1dHJhbDogdGhlbWVUb2tlbnMuY29sb3JzLm5ldXRyYWwsXG4gICAgc3VyZmFjZTogdGhlbWVUb2tlbnMuY29sb3JzLnN1cmZhY2UsXG4gICAgaW5mbzogdGhlbWVUb2tlbnMuY29sb3JzLnNlbWFudGljLmluZm8sXG4gICAgc3VjY2VzczogdGhlbWVUb2tlbnMuY29sb3JzLnNlbWFudGljLnN1Y2Nlc3MsXG4gICAgd2FybmluZzogdGhlbWVUb2tlbnMuY29sb3JzLnNlbWFudGljLndhcm5pbmcsXG4gICAgZGFuZ2VyOiB0aGVtZVRva2Vucy5jb2xvcnMuc2VtYW50aWMuZGFuZ2VyLFxuICB9LFxuICBmb250RmFtaWx5OiB0aGVtZVRva2Vucy5mb250RmFtaWx5LFxuICBmb250U2l6ZTogdGhlbWVUb2tlbnMuZm9udFNpemUsXG4gIGJvcmRlclJhZGl1czogdGhlbWVUb2tlbnMucmFkaWksXG4gIHNwYWNpbmc6IHRoZW1lVG9rZW5zLnNwYWNpbmcsXG4gIGJveFNoYWRvdzogdGhlbWVUb2tlbnMuc2hhZG93cyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBjb25zdCBicmFuZEtleXMgPSBPYmplY3Qua2V5cyh0aGVtZVRva2Vucy5jb2xvcnMuYnJhbmQpIGFzIEFycmF5PGtleW9mIEJyYW5kU2NhbGU+O1xuZXhwb3J0IGNvbnN0IG5ldXRyYWxLZXlzID0gT2JqZWN0LmtleXModGhlbWVUb2tlbnMuY29sb3JzLm5ldXRyYWwpIGFzIEFycmF5PGtleW9mIE5ldXRyYWxTY2FsZT47XG5cbmV4cG9ydCB0eXBlIFRoZW1lQ29sb3JUb2tlbiA9IGtleW9mIFRoZW1lVG9rZW5zWydjb2xvcnMnXTtcblxuZXhwb3J0IGNvbnN0IGJ1aWxkVmVyc2lvbiA9ICgpID0+XG4gIChpbXBvcnQubWV0YS5lbnYuVklURV9BUFBfQlVJTERfVkVSU0lPTiBhcyBzdHJpbmcgfCB1bmRlZmluZWQpID8/ICdkZXYnO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3NyYy9jb25maWdcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3Byb2plY3Qvc3JjL2NvbmZpZy9hcHAtbWV0YWRhdGEudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvcHJvamVjdC9zcmMvY29uZmlnL2FwcC1tZXRhZGF0YS50c1wiO2ltcG9ydCB7IHRoZW1lVG9rZW5zIH0gZnJvbSAnLi90aGVtZS10b2tlbnMnO1xuXG5leHBvcnQgY29uc3QgYXBwTWV0YWRhdGEgPSB7XG4gIG5hbWU6ICdIYWNrYXRob24gSnVkZ2UnLFxuICBzaG9ydE5hbWU6ICdKdWRnZScsXG4gIGRlc2NyaXB0aW9uOlxuICAgICdDb29yZGluYXRlIGp1ZGdpbmcgYXNzaWdubWVudHMsIGNhcHR1cmUgc2NvcmVzLCBhbmQgc3RheSBhbGlnbmVkIHdpdGggdGhlIGhhY2thdGhvbiBicmllZlx1MjAxNG9ubGluZSBvciBvZmZsaW5lLicsXG4gIHRoZW1lQ29sb3I6IHRoZW1lVG9rZW5zLmNvbG9ycy5icmFuZFs2MDBdLFxuICBiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lVG9rZW5zLmNvbG9ycy5zdXJmYWNlLmJhc2UsXG4gIG9mZmxpbmVTbmFwc2hvdE5hbWU6ICdvZmZsaW5lLWJyaWVmJyxcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsZUFBZSxXQUFXO0FBRTVQLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7OztBQ0p4QjtBQUFBLEVBQ0UsUUFBVTtBQUFBLElBQ1Is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
