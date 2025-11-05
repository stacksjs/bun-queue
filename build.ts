import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['packages/bun-queue/src/index.ts'],
  outdir: './dist',
  target: 'bun',
  plugins: [dts({
    build: {
      config: {
        root: 'packages/bun-queue/src',
      },
    },
  })],
})
