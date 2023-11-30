import cac from 'cac'
import { version } from '../package.json'

const cli = cac()

cli.option('--type <type>', 'Choose a project type', {
  default: 'node',
})

cli.help()

cli.version(version)

const parsed = cli.parse()

console.log(JSON.stringify(parsed, null, 2))
