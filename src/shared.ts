import { join } from 'node:path'
import process from 'node:process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { createConsola } from 'consola'
import parseGitURL from 'git-url-parse'

export const configDir = join(process.env.HOME!, '.repom')
export const configPath = join(configDir, 'config.json')

export interface Config {
  baseDir: string
  groupBy: {
    'source': boolean
    'owner': boolean
    'name': boolean
  }
}

export const defaultConfig: Config = {
  baseDir: `${process.env.HOME}/Documents/Code`,
  groupBy: {
    source: false,
    owner: true,
    name: true,
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
  if (config.groupBy.name) {
    suffixPaths.push(parsed.name)
  }

  const targetPath = join(config.baseDir, ...suffixPaths)

  return targetPath
}
