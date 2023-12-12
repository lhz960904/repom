import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { configDir, configPath, logger } from 'src/shared'
import { init } from '../src/command/init'

describe('command init', () => {
  beforeAll(() => {
    logger.wrapAll()
  })

  beforeEach(() => {
    logger.mockTypes(() => vi.fn())
  })

  it('config should be create if not exist', async () => {
    await fsp.rm(configDir, { recursive: true })
    expect(fs.existsSync(configPath)).toBe(false)
    await init()
    // @ts-expect-error test only
    const stdout = logger.success.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatch(/Config created/)
    expect(fs.existsSync(configPath)).toBe(true)
  })

  it('call again should warn if config exist', async () => {
    await init()
    // @ts-expect-error test only
    const stdout = logger.warn.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatch(/Config already exists/)
    expect(fs.existsSync(configPath)).toBe(true)
  })
})
