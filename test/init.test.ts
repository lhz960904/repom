import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from 'src/shared'
import { init } from '../src/command/init'

vi.mock('node:fs/promises')
vi.mock('node:fs')

describe('command init', () => {
  beforeAll(() => {
    logger.wrapAll()
  })

  beforeEach(() => {
    logger.mockTypes(() => vi.fn())
  })

  it('config should be create if not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(false)
    await init()
    vi.mocked(fsp.writeFile).mockResolvedValueOnce()
    // @ts-expect-error test only
    const stdout = logger.success.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatch(/Config created/)
    expect(stdout).toMatchInlineSnapshot(`
      [
        "Config created, you can edit it manually.",
      ]
    `)
  })

  it('call again should warn if config exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true)
    await init()
    // @ts-expect-error test only
    const stdout = logger.warn.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatch(/Config already exists/)
  })
})
