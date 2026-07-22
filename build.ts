import { dts } from 'bun-plugin-dtsx'
import { cpSync, rmSync, statSync } from 'node:fs'

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

const commandSource = 'packages/bun-queue/src/commands'
const commandOutput = 'dist/commands'
rmSync(commandOutput, { recursive: true, force: true })
cpSync(commandSource, commandOutput, {
  recursive: true,
  filter: source => statSync(source).isDirectory() || source.endsWith('.lua'),
})
