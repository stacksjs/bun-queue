import { dts } from 'bun-plugin-dtsx'
import { cpSync, rmSync, statSync } from 'node:fs'

// Library build only. The CLI (bin/cli.ts) is shipped as a compiled
// binary via the `compile` script, not through dist — including it here
// shifted Bun's output root and emitted dist/src/index.js instead of the
// dist/index.js that package exports resolve to.
rmSync('./dist', { recursive: true, force: true })

await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: './dist',
  target: 'bun',
  minify: true,
  plugins: [dts({ build: { config: { root: 'src' } } })],
})

// Redis commands are runtime assets loaded relative to the compiled module.
// Keep the package-local build used by prepublishOnly complete on a clean
// checkout instead of relying on a prior root build to populate dist.
cpSync('src/commands', 'dist/commands', {
  recursive: true,
  filter: source => statSync(source).isDirectory() || source.endsWith('.lua'),
})
