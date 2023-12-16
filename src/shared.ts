import { join } from 'node:path'
import process from 'node:process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { createConsola } from 'consola'
import parseGitURL from 'git-url-parse'
import fg from 'fast-glob'
import ora from 'ora'

const HOME = process.env.HOME!
export const configDir = join(HOME, '.repom')
export const configPath = join(configDir, 'config.json')

export interface Config {
  baseDir: string
  groupBy: {
    'source': boolean
    'owner': boolean
  }
}

export const defaultConfig: Config = {
  baseDir: `${HOME}/Documents/Code`,
  groupBy: {
    source: false,
    owner: true,
  },
}

export const logger = createConsola({
  level: process.env.DEBUG ? 4 : 3,
})

export async function resolveConfig(): Promise<Config> {
  if (fs.existsSync(configPath)) {
    return JSON.parse(await fsp.readFile(configPath, 'utf-8'))
  }
  return defaultConfig
}

export async function resolveTargetPath(repository: string) {
  const config = await resolveConfig()

  const parsed = parseGitURL(repository)
  const suffixPaths = []

  if (config.groupBy.source) {
    suffixPaths.push(parsed.source)
  }
  if (config.groupBy.owner) {
    suffixPaths.push(parsed.owner)
  }
  suffixPaths.push(parsed.name)

  const targetPath = join(config.baseDir, ...suffixPaths)

  return targetPath
}

export function normalizeCliWidth(strArr: string[]) {
  const max = strArr.reduce((acc, cur) => Math.max(acc, cur.length), 0)
  return strArr.map(str => str.padEnd(max))
}

export async function scanRepo(cwd: string) {
  const spinner = ora('scan repositories').start()
  const dirs = await fg(['**/.git', '!**/node_modules/**'], {
    onlyDirectories: true,
    cwd,
  })
  spinner.stop()
  return dirs.map(item => join(cwd, item.replace(/\/\.git$/, '')))
}
