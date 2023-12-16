import type { PathLike } from 'node:fs'
import { logger } from 'src/shared'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkExistDir, checkNestedDir, showMoveDiff } from 'src/command/clean_up'
import fse from 'fs-extra'

vi.mock('fs-extra')

describe('command cleanUp', () => {
  beforeAll(() => {
    logger.wrapAll()
  })

  beforeEach(() => {
    logger.mockTypes(() => vi.fn())
  })

  it('checkNestedDir', async () => {
    const tasks = [
      { oldPath: '/test/github.com/repom', newPath: '/test/github.com/repom' },
      // nested dir
      { oldPath: '/test/github.com/abc', newPath: '/test/github.com/abc' },
      { oldPath: '/test/github.com/abc/def', newPath: '/test/github.com/abc/def' },
      // not nested dir
      { oldPath: '/test/github.com/notNested', newPath: '/test/github.com/notNested' },
      { oldPath: '/test/github.com/notNested2', newPath: '/test/github.com/notNested2' },
    ]
    const result = checkNestedDir(tasks)
    expect(result).toEqual([
      { oldPath: '/test/github.com/repom', newPath: '/test/github.com/repom' },
      { oldPath: '/test/github.com/notNested', newPath: '/test/github.com/notNested' },
      { oldPath: '/test/github.com/notNested2', newPath: '/test/github.com/notNested2' },
    ])
    // @ts-expect-error test only
    const stdout = logger.warn.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatchInlineSnapshot(`
      [
        "The following directories are nested(.git), them will be ignored",
      ]
    `)
  })

  it('checkExistDir', async () => {
    vi.mocked(fse.existsSync).mockImplementation((path: PathLike) => {
      return path === '/test/github.com/repom'
    })

    const result = checkExistDir([
      { oldPath: '/test/github.com/repom', newPath: '/test/github.com/repom' },
      { oldPath: '/test/github.com/repom2', newPath: '/test/github.com/repom2' },
    ])
    expect(result).toEqual([
      { oldPath: '/test/github.com/repom2', newPath: '/test/github.com/repom2' },
    ])
    // @ts-expect-error test only
    const stdout = logger.warn.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatchInlineSnapshot(`
      [
        "The following directories already exist, them will be ignored",
      ]
    `)
  })
})
