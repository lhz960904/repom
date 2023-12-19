import fs from 'node:fs'
import { $ } from 'execa'
import { logger, resolveTargetPath } from 'src/shared'
import c from 'picocolors'
import ora from 'ora'
import clipboard from 'clipboardy'

export async function add(repository: string, options: { open?: boolean }) {
  const targetPath = await resolveTargetPath(repository)

  if (fs.existsSync(targetPath)) {
    logger.error(`Repository already exists, path: ${c.yellow(targetPath)}`)
    return
  }

  const spinner = ora(`Cloning into ${targetPath}`).start()

  await $`git clone ${repository} ${targetPath}`

  spinner.succeed()

  await clipboard.write(`cd ${targetPath}`)
  logger.success(`📋 ${c.green('Copied to clipboard')}, just use Ctrl+V`)

  if (options.open) {
    try {
      await $`code ${targetPath}`
    }
    catch (error) {
      logger.error(`Open vscode failed, ${error}`)
    }
  }
}
