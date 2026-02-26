import plugin from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  splitting: true,
  sourcemap: 'external',
  minify: false,
  plugins: [plugin()],
})

console.log('Build complete!')
