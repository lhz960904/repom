import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger, scanRepo } from 'src/shared'
import { clearEmptyDir, remove } from 'src/command/remove'
import confirm from '@inquirer/confirm'
import checkbox from '@inquirer/checkbox'

vi.mock('node:fs')
vi.mock('node:fs/promises')
vi.mock('execa')
vi.mock('@inquirer/confirm')
vi.mock('@inquirer/checkbox')
vi.mock('src/shared', async (importOriginal) => {
  const mod = await importOriginal<typeof import('src/shared')>()
  return {
    ...mod,
    scanRepo: vi.fn(),
  }
})

describe('command remove', () => {
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
    await remove('test')
    // @ts-expect-error test only
    const stdout = logger.error.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatch(/No match repository/)
  })

  it('should be remove repo', async () => {
    vi.mocked(scanRepo).mockResolvedValueOnce(['/test/repom'])
    vi.mocked(confirm).mockResolvedValueOnce(true)
    await remove('repom')
    expect(confirm).toBeCalledTimes(1)
    vi.mocked(scanRepo).mockResolvedValueOnce(['/test/repom', '/test/repom2'])
    await remove('repom')
    expect(checkbox).toBeCalledTimes(1)
    expect(checkbox).toBeCalledWith({
      message: 'Select repositories to remove',
      choices: [
        { name: '/test/repom', value: '/test/repom' },
        { name: '/test/repom2', value: '/test/repom2' },
      ],
    })
  })

  it('clearEmptyDir', async () => {
    await clearEmptyDir('/test/Code/asd/repom', '/test')
    vi.mocked(fsp.readdir).mockResolvedValueOnce([])
    expect(fsp.rm).toBeCalledTimes(2)
  })
})
