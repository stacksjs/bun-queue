import { dts } from 'bun-plugin-dtsx'
import { cpSync, rmSync, statSync } from 'node:fs'

const packageOutput = 'packages/bun-queue/dist'
rmSync(packageOutput, { recursive: true, force: true })

await Bun.build({
  entrypoints: ['packages/bun-queue/src/index.ts'],
  outdir: packageOutput,
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
const commandOutput = `${packageOutput}/commands`
rmSync(commandOutput, { recursive: true, force: true })
cpSync(commandSource, commandOutput, {
  recursive: true,
  filter: source => statSync(source).isDirectory() || source.endsWith('.lua'),
})
