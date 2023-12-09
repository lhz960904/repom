import chalk from 'chalk'
import clipboard from 'clipboardy'
import { logger, resolveConfig, scanRepo } from 'src/shared'
import { $ } from 'execa'
import { select } from '@inquirer/prompts'

export async function find(name: string, options: { open?: boolean }) {
  const config = await resolveConfig()

  const dirs = await scanRepo(config.baseDir)

  const matchDirs = dirs.map((path: string) => path.includes(name) ? path : '').filter(Boolean)

  if (matchDirs.length === 0) {
    logger.error('No match repository')
    return
  }

  let targetPath = ''

  if (matchDirs.length === 1) {
    targetPath = matchDirs[0]
  }
  else {
    const dir = await select({
      message: 'Select a repository',
      choices: matchDirs.map(dir => ({ name: dir, value: dir })),
    })
    targetPath = dir
  }

  if (targetPath) {
    await clipboard.write(`cd ${matchDirs[0]}`)
    logger.success(`find successfully, path: ${chalk.yellow(targetPath)}`)
    logger.success(`📋 ${chalk.green('Copied to clipboard')}, just use Ctrl+V`)
    if (options.open) {
      try {
        await $`code ${matchDirs[0]}`
      }
      catch (error) {
        logger.error(`Open vscode failed, ${error}`)
      }
    }
  }
}
