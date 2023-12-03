import { dirname, join } from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import fg from 'fast-glob'
import { configDir, logger, resolveConfig } from 'src/shared'
import checkbox, { Separator } from '@inquirer/checkbox'
import confirm from '@inquirer/confirm'
import { $ } from 'execa'
import chalk from 'chalk'
import ora from 'ora'

async function clearEmptyDir(path: string, endPath: string) {
  const parentPath = dirname(path)
  if (parentPath === endPath) {
    return
  }
  if (fs.readdirSync(parentPath).length === 0) {
    await fsp.rm(parentPath, { recursive: true })
    await clearEmptyDir(parentPath, endPath)
  }
}

async function removeDir(dirs: string[]) {
  const config = await resolveConfig()
  const spinner = ora(`begin remove repository`).start()
  for (const dir of dirs) {
    spinner.text = `removing repository ${chalk.yellow(dir)}`
    const targetPath = join(config.baseDir, dir)
    await fsp.rm(targetPath, { recursive: true })
    await clearEmptyDir(targetPath, config.baseDir)
  }
  spinner.succeed('removed successfully')
}

export async function remove(name: string) {
  const config = await resolveConfig()

  const dirs = await fg(['**/.git', '!**/node_modules/**'], {
    onlyDirectories: true,
    cwd: config.baseDir,
  })

  const matchDirs = dirs.map((directory: string) => {
    const path = directory.replace(/\/\.git$/, '')
    return path.split('/').pop()?.includes(name) ? path : ''
  }).filter(Boolean)

  if (matchDirs.length === 0) {
    logger.error('No match repository')
    return
  }
  if (matchDirs.length === 1) {
    try {
      const confirmRemove = await confirm({ message: `Confirm remove ${chalk.yellow(matchDirs[0])}` })
      if (confirmRemove) {
        removeDir(matchDirs)
      }
    }
    catch (error) {
      logger.error(error)
    }
    return
  }

  try {
    const dirs = await checkbox({
      message: 'Select repositories to remove',
      choices: matchDirs.map(dir => ({ name: dir, value: dir })),
    })
    await removeDir(dirs)
  }
  catch (error) {
    logger.error(error)
  }
}
