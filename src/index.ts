import cac from 'cac'
import { version } from '../package.json'
import { init } from './command/init'
import { add } from './command/add'
import { remove } from './command/remove'

const cli = cac('repom')

cli.command('init', 'Init repom cli config').action(init)

cli.command('add <repository>', 'Clone a repository into directory')
  .option('-o, --open', 'Auto open by vscode')
  .action(add)

cli.command('remove <name>', 'Remove repository by name, support fuzzy match').action(remove)

cli.help()

cli.version(version)

cli.parse()
