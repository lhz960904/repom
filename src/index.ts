import cac from 'cac'
import { version } from '../package.json'
import { init } from './command/init'
import { add } from './command/add'

const cli = cac('repom')

cli.command('init', 'Init repom cli config').action(init)

cli.command('add <repository>', 'Clone a repository into directory').action(add)

cli.help()

cli.version(version)

cli.parse()
