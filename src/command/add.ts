import fs from 'node:fs'
import { $ } from 'execa'
import { logger, resolveTargetPath } from 'src/shared'
import chalk from 'chalk'
import ora from 'ora'
import clipboard from 'clipboardy'

export async function add(repository: string) {
  const targetPath = await resolveTargetPath(repository)

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
