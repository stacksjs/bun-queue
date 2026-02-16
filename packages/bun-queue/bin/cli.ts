/* eslint-disable no-console */
import { CLI } from '@stacksjs/clapp'
import { version } from '../package.json'

const cli = new CLI('queue')

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
