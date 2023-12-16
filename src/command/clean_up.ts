import path from 'node:path'
import { logger, normalizeCliWidth, resolveConfig, resolveTargetPath, scanRepo } from 'src/shared'
import confirm from '@inquirer/confirm'
import chalk from 'chalk'
import ora from 'ora'
import gitRemoteOriginUrl from 'git-remote-origin-url'
import fse from 'fs-extra'
import { clearEmptyDir } from './remove'

interface Task {
  oldPath: string
  newPath: string
}

export async function cleanUp(targetDir?: string) {
  const config = await resolveConfig()
  const sourceDir = targetDir ?? config.baseDir

  const dirs = await scanRepo(sourceDir)

  const failedRemoteDirs: string[] = []
  let tasks: Task[] = await Promise.all(dirs.map(async (oldPath) => {
    try {
      const remoteURL = await gitRemoteOriginUrl({ cwd: oldPath })
      const newPath = await resolveTargetPath(remoteURL)
      return { oldPath, newPath }
    }
    catch (error) {
      failedRemoteDirs.push(oldPath)
    }
    return { oldPath: '', newPath: '' }
  }))

  if (failedRemoteDirs.length) {
    logger.warn(`The following directories can't resolve git remote url, them will be ignored`)
    logger.log(chalk.yellow(failedRemoteDirs.join('\n')))
  }

  // filter don't need move
  tasks = tasks.filter(task => task.oldPath !== task.newPath)

  // check if target directory exists, if exists filter it
  tasks = checkExistDir(tasks)

  // check nested directory, nested directory not allowed, if exists filter it
  tasks = checkNestedDir(tasks)

  tasks.sort((a, b) => a.oldPath.length - b.oldPath.length)

  showMoveDiff(sourceDir, config.baseDir, tasks)

  const spinner = ora('Moving')
  try {
    const confirmMove = await confirm({ message: `Confirm moving the directory according to the above info ?` })
    if (!confirmMove) return
    spinner.start()
    for (const task of tasks) {
      spinner.text = `Moving ${task.oldPath} to ${task.newPath}`
      await fse.move(task.oldPath, task.newPath)
      await clearEmptyDir(task.oldPath, sourceDir)
    }
    spinner.succeed(`Done! If it's helpful to you, please ⭐️ it on Github, Thank you!`)
  }
  catch (error) {
    spinner.stop()
    logger.error(error)
  }
}

function arePathsNested(path1: string, path2: string) {
  if (path1 === path2) return false
  const relativePath = path.relative(path1, path2)
  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}

export function checkNestedDir(tasks: Task[]) {
  const nestedDirs: string[] = []
  tasks.forEach((task) => {
    const childDirs = tasks
      .map(t => arePathsNested(task.oldPath, t.oldPath) ? t.oldPath : null)
      .filter(Boolean) as string[]
    if (childDirs?.length) {
      nestedDirs.push(task.oldPath)
      nestedDirs.push(...childDirs)
    }
  })

  if (nestedDirs.length) {
    logger.warn(`The following directories are nested(.git), them will be ignored`)
    logger.log(chalk.yellow(nestedDirs.join('\n')))
  }
  tasks = tasks.filter(task => !nestedDirs.includes(task.oldPath))
  return tasks
}

export function checkExistDir(tasks: Task[]) {
  const existedDirs = tasks.map(task => fse.existsSync(task.newPath) ? task.oldPath : null).filter(Boolean)
  if (existedDirs.length) {
    logger.warn(`The following directories already exist, them will be ignored`)
    logger.log(chalk.yellow(existedDirs.join('\n')))
  }
  tasks = tasks.filter(task => !existedDirs.includes(task.oldPath))
  return tasks
}

export function showMoveDiff(sourceDir: string, targetDir: string, tasks: Task[]) {
  tasks = normalizeCliWidth(tasks.map(task => task.oldPath)).map((oldPath, index) => {
    return { oldPath, newPath: tasks[index].newPath }
  })
  logger.log('')
  logger.log(`clean up 📂${chalk.cyanBright(sourceDir)} repositories into 📂${chalk.cyanBright(targetDir)}`)
  tasks.forEach((task) => {
    let i = 0
    while (task.oldPath[i] === task.newPath[i]) {
      i++
    }
    const oldPath = chalk.red(task.oldPath.slice(i))
    const newPath = chalk.gray(task.newPath.slice(0, i)) + chalk.greenBright(task.newPath.slice(i))
    logger.log(`${oldPath}  ${chalk.green('->')}  ${chalk.yellow(newPath)}`)
  })
}
