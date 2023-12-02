import fs from 'node:fs'
import { join } from 'node:path'
import { $ } from 'execa'
import { logger, resolveConfig } from 'src/shared'
import parseGitURL from 'git-url-parse'
import chalk from 'chalk'
import ora from 'ora'
import clipboard from 'clipboardy'

export async function add(repository: string) {
  const config = await resolveConfig()

  // TODO get group name from repository

  const parsed = parseGitURL(repository)
  logger.debug(`clone repository name: ${parsed.name}`)

  const targetPath = join(config.baseDir, parsed.name)
  if (fs.existsSync(targetPath)) {
    logger.error(`Repository already exists, path: ${chalk.yellow(targetPath)}`)
    return
  }

  const spinner = ora(`Cloning into ${targetPath}`).start()

  await $`git clone ${repository} ${targetPath}`

  spinner.succeed()

  await clipboard.write(`cd ${targetPath}`)
  logger.success(`📋 ${chalk.green('Copied to clipboard')}, just use Ctrl+V`)
}
