import { join } from 'node:path'
import process from 'node:process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { createConsola } from 'consola'

export const configDir = join(process.env.HOME!, '.repom')
export const configPath = join(configDir, 'config.json')

export interface Config {
  baseDir: string
}

export const defaultConfig: Config = {
  baseDir: `${process.env.HOME}/Documents/Code`,
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
