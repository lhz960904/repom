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

  let tasks: Task[] = await Promise.all(dirs.map(async (oldPath) => {
    try {
      const remoteURL = await gitRemoteOriginUrl({ cwd: oldPath })
      const newPath = await resolveTargetPath(remoteURL)
      return { oldPath, newPath }
    }
    catch (error) {
      logger.warn(`Can't resolve git remote url for ${chalk.cyanBright(oldPath)}, it will be ignored`)
    }
    return { oldPath: '', newPath: '' }
  }))

  // filter don't need move
  tasks = tasks.filter(task => task.oldPath !== task.newPath)

  // check if target directory exists, if exists filter it
  tasks = checkExistDir(tasks)

  // check nested directory, nested directory not allowed, if exists filter it
  tasks = checkNestedDir(tasks)

  showMoveDiff(sourceDir, config.baseDir, tasks)

  try {
    const confirmMove = await confirm({ message: `Confirm moving the directory according to the above info ?` })
    if (!confirmMove) return
    const spinner = ora('Moving').start()
    for (const task of tasks) {
      spinner.text = `Moving ${task.oldPath} to ${task.newPath}`
      await fse.move(task.oldPath, task.newPath)
      await clearEmptyDir(task.oldPath, sourceDir)
    }
    spinner.succeed(`Done! If it's helpful to you, please ⭐️ it on Github, Thank you!`)
  }
  catch (error) {
    logger.error(error)
  }
}

function checkNestedDir(tasks: Task[]) {
  const nestedDirs: string[] = []
  tasks.forEach((task) => {
    const childDirs = tasks.map(t =>
      t.oldPath.startsWith(task.oldPath) && t.oldPath !== task.oldPath ? t.oldPath : null,
    ).filter(Boolean) as string[]
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

function checkExistDir(tasks: Task[]) {
  const existedDirs = tasks.map(task => fse.existsSync(task.newPath) ? task.oldPath : null).filter(Boolean)
  if (existedDirs.length) {
    logger.warn(`The following directories already exist, them will be ignored`)
    logger.log(chalk.yellow(existedDirs.join('\n')))
  }
  tasks = tasks.filter(task => !existedDirs.includes(task.oldPath))
  return tasks
}

function showMoveDiff(sourceDir: string, targetDir: string, tasks: Task[]) {
  tasks.sort((a, b) => a.oldPath.length - b.oldPath.length)

  normalizeCliWidth(tasks.map(task => task.oldPath)).forEach((oldPath, index) => {
    tasks[index].oldPath = oldPath
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
