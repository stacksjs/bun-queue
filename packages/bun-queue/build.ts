import { dts } from 'bun-plugin-dtsx'

// Library build only. The CLI (bin/cli.ts) is shipped as a compiled
// binary via the `compile` script, not through dist — including it here
// shifted Bun's output root and emitted dist/src/index.js instead of the
// dist/index.js that package exports resolve to.
await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: './dist',
  target: 'bun',
  minify: true,
  plugins: [dts({ build: { config: { root: 'src' } } })],
})
