import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger, scanRepo } from 'src/shared'
import { find } from 'src/command/find'
import { select } from '@inquirer/prompts'
import { $ } from 'execa'

vi.mock('node:fs')
vi.mock('node:fs/promises')
vi.mock('execa')
vi.mock('@inquirer/prompts')
vi.mock('src/shared', async (importOriginal) => {
  const mod = await importOriginal<typeof import('src/shared')>()
  return {
    ...mod,
    scanRepo: vi.fn(),
  }
})
vi.mock('execa')

describe('command find', () => {
  beforeAll(() => {
    logger.wrapAll()
  })

  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true)
    vi.mocked(fsp.readFile).mockResolvedValueOnce(JSON.stringify({ baseDir: '/test', groupBy: { source: true, owner: true } }))
    vi.mocked(fsp.readdir).mockResolvedValue([])
    vi.mocked(fsp.rm).mockClear()
    vi.mocked(fsp.rm).mockResolvedValue()
    logger.mockTypes(() => vi.fn())
  })

  it('should be error if not find directory', async () => {
    vi.mocked(scanRepo).mockResolvedValueOnce([])
    await find('test', {})
    // @ts-expect-error test only
    const stdout = logger.error.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatch(/No match repository/)
  })

  it('find one repository', async () => {
    vi.mocked(scanRepo).mockResolvedValueOnce(['/test/repom'])

    await find('repom', { open: true })
    expect($).toHaveBeenLastCalledWith(['code ', ''], '/test/repom')
  })

  it('find multiple repository', async () => {
    vi.mocked(scanRepo).mockResolvedValueOnce(['/test/repom', '/test/repom2'])
    vi.mocked(select).mockResolvedValueOnce('/test/repom')
    await find('repom', {})
    expect(select).toBeCalledTimes(1)
    expect(select).toBeCalledWith({
      message: 'Select a repository',
      choices: [
        { name: '/test/repom', value: '/test/repom' },
        { name: '/test/repom2', value: '/test/repom2' },
      ],
    })
    // @ts-expect-error test only
    const stdout = logger.success.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatch(/find successfully/)
  })
})
