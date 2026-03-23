import { Glob } from 'bun'
import dtsx from 'bun-plugin-dtsx'
import stxPlugin from 'bun-plugin-stx'

// 1. Build the JS library (src/index.ts → dist/)
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  splitting: true,
  sourcemap: 'external',
  minify: false,
  plugins: [dtsx()],
})

// eslint-disable-next-line no-console
console.log('JS build complete!')

// 2. Build stx pages → dist/pages/ (HTML via bun-plugin-stx)
const stxPages: string[] = []
const glob = new Glob('*.stx')
for await (const file of glob.scan('./src/pages')) {
  stxPages.push(`./src/pages/${file}`)
}

const stxResult = await Bun.build({
  entrypoints: stxPages,
  outdir: './dist/pages',
  plugins: [stxPlugin({
    componentsDir: './src/components',
    layoutsDir: './src/layouts',
    partialsDir: './src/partials',
  })],
})

// eslint-disable-next-line no-console
console.log(`STX build complete! (${stxResult.outputs.length} pages)`)
// eslint-disable-next-line no-console
console.log('Build complete!')
