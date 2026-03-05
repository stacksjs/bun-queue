import { Glob } from 'bun'
import { buildAndWrite, defaultConfig as cwDefaults } from '@cwcss/crosswind'
import dtsx from 'bun-plugin-dtsx'
import stxPlugin from 'bun-plugin-stx'
import path from 'node:path'

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

console.log('JS build complete!')

// 2. Build stx pages → dist/pages/ (HTML via bun-plugin-stx loader)
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

// Flatten output: dist/pages/src/pages/*.html → dist/pages/*.html
const htmlGlob = new Glob('**/*.html')
for await (const file of htmlGlob.scan('./dist/pages')) {
  const src = path.join('./dist/pages', file)
  const name = path.basename(file)
  const dest = path.join('./dist/pages', name)
  if (src !== dest) {
    await Bun.write(dest, Bun.file(src))
  }
}
// Clean up nested dirs left over from flattening
const { rmSync } = await import('node:fs')
try { rmSync('./dist/pages/src', { recursive: true }) } catch {}

console.log(`STX build complete! (${stxResult.outputs.length} pages)`)

// 3. Generate Crosswind CSS — scans all .stx files, purges unused, writes single CSS file
const cwResult = await buildAndWrite({
  ...cwDefaults,
  content: ['./src/**/*.stx'],
  output: './dist/crosswind.css',
  minify: true,
  cssVariables: true,
})

console.log(`Crosswind CSS: ${cwResult.classes.size} utility classes → dist/crosswind.css (${cwResult.duration}ms)`)

// 4. Inject <link rel="stylesheet" href="/crosswind.css"> into all built HTML pages
for await (const file of htmlGlob.scan('./dist/pages')) {
  // Only process top-level HTML files (already flattened)
  if (file.includes('/')) continue
  const filePath = `./dist/pages/${file}`
  let html = await Bun.file(filePath).text()
  if (!html.includes('crosswind.css')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="/crosswind.css">\n</head>')
    await Bun.write(filePath, html)
  }
}

console.log('Build complete!')
