// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// `STATIC_BUILD=1 vite build` produces a browser-only bundle that any plain
// file host (cPanel/Litespeed/Apache, e.g. QServers) can serve: no Node server,
// no server functions. Everything else keeps the normal Lovable build.
const isStaticBuild = process.env["STATIC_BUILD"] === "1";

export default defineConfig(
  isStaticBuild
    ? {
        nitro: false,
        tanstackStart: { spa: { enabled: true } },
      }
    : {
        tanstackStart: {
          // Redirect TanStack Start's bundled server entry to src/server.ts (SSR error wrapper).
          server: { entry: "server" },
        },
      },
);
