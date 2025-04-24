import { CAC } from 'cac'
import { version } from '../package.json'

const cli = new CAC('my-cli')

interface CliOption {
  from: string
  verbose: boolean
}

cli
  .command('start', 'Start the Reverse Proxy Server')
  .option('--from <from>', 'The URL to proxy from')
  .option('--verbose', 'Enable verbose logging')
  .example('reverse-proxy start --from localhost:5173 --to my-project.localhost')
  .action(async (options?: CliOption) => {
    if (!options?.from) {
      console.error('Missing --from option')
    }
    else {
      console.log('Options:', options)
    }
  })

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
