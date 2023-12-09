import { dirname, join } from 'node:path'
import fsp from 'node:fs/promises'
import { logger, resolveConfig, scanRepo } from 'src/shared'
import checkbox from '@inquirer/checkbox'
import confirm from '@inquirer/confirm'
import chalk from 'chalk'
import ora from 'ora'

async function clearEmptyDir(path: string, endPath: string) {
  const parentPath = dirname(path)
  if (parentPath === endPath) {
    return
  }
  const files = await fsp.readdir(parentPath)
  if (files.length === 0) {
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

  const dirs = await scanRepo(config.baseDir)

  const matchDirs = dirs.map((path: string) => path.split('/').pop()?.includes(name) ? path : '').filter(Boolean)

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
