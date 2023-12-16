import fsp from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from 'src/shared'
import { add } from 'src/command/add'
import { $ } from 'execa'

vi.mock('node:fs')
vi.mock('node:fs/promises')
vi.mock('execa')

describe('command add', () => {
  beforeAll(() => {
    logger.wrapAll()
  })

  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true)
    vi.mocked(fsp.readFile).mockResolvedValueOnce(JSON.stringify({ baseDir: '/test', groupBy: { source: true, owner: true } }))
    logger.mockTypes(() => vi.fn())
  })

  it('should be error if target path exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true)

    await add('https://github.com/lhz960904/repom.git', {})
    // @ts-expect-error test only
    const stdout = logger.error.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatch(/Repository already exists/)
  })

  it('clone if target path not exist', async () => {
    await add('https://github.com/lhz960904/repom.git', {})
    expect($).toBeCalledWith([
      'git clone ',
      ' ',
      '',
    ], 'https://github.com/lhz960904/repom.git', path.normalize('/test/github.com/lhz960904/repom'))
  })

  it('execute code command if with open command', async () => {
    await add('https://github.com/lhz960904/repom.git', { open: true })
    expect($).toHaveBeenLastCalledWith(['code ', ''], path.normalize('/test/github.com/lhz960904/repom'))
  })
})
