import cac from 'cac'
import { version } from '../package.json'
import { init } from './command/init'
import { add } from './command/add'
import { remove } from './command/remove'
import { cleanUp } from './command/clean_up'
import { find } from './command/find'

const cli = cac('repom')

cli.command('init', 'Init repom cli config').action(init)

cli.command('add <repository>', 'Clone a repository into directory')
  .option('-o, --open', 'Auto open by vscode')
  .action(add)

cli.command('remove <name>', 'Remove repository by name, support fuzzy match').action(remove)

cli.command('find <name>', 'Find repository by name, support fuzzy match')
  .option('-o, --open', 'Auto open by vscode')
  .action(find)

cli.command('clean-up [dir]', 'Clean up existed directories to base dir').action(cleanUp)

cli.help()

cli.version(version)

cli.parse()
