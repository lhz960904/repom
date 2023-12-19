import fs from 'node:fs'
import fsp from 'node:fs/promises'
import c from 'picocolors'
import { configDir, configPath, defaultConfig, logger } from 'src/shared'

const configPathTip = `Config path: ${c.yellow(configPath)}`

export async function init() {
  if (fs.existsSync(configPath)) {
    logger.warn('Config already exists, you can edit it manually.', configPathTip)
    return
  }
  if (!fs.existsSync(configDir)) {
    await fsp.mkdir(configDir, { recursive: true })
  }

  await fsp.writeFile(configPath, JSON.stringify(defaultConfig, null, 2))
  logger.success('Config created, you can edit it manually.', configPathTip)
}
