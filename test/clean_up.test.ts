import type { PathLike } from 'node:fs'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { logger, scanRepo } from 'src/shared'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkExistDir, checkNestedDir, cleanUp, showMoveDiff } from 'src/command/clean_up'
import fse from 'fs-extra'

vi.mock('fs-extra')
vi.mock('node:fs')
vi.mock('node:fs/promises')
vi.mock('src/shared', async (importOriginal) => {
  const mod = await importOriginal<typeof import('src/shared')>()
  return {
    ...mod,
    scanRepo: vi.fn(),
  }
})

describe('command cleanUp', () => {
  beforeAll(() => {
    logger.wrapAll()
  })

  beforeEach(() => {
    // vi.mocked(fs.existsSync).mockReturnValueOnce(true)
    // vi.mocked(fsp.readFile).mockResolvedValueOnce(JSON.stringify({ baseDir: '/test', groupBy: { source: true, owner: true } }))
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
    // @ts-expect-error test only
    const stdout2 = logger.log.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatchInlineSnapshot(`
      [
        "The following directories are nested(.git), them will be ignored",
      ]
    `)
    expect(stdout2).toMatchInlineSnapshot(`
      [
        "[33m/test/github.com/abc[39m
      [33m/test/github.com/abc/def[39m",
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
    // @ts-expect-error test only
    const stdout2 = logger.log.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatchInlineSnapshot(`
      [
        "The following directories already exist, them will be ignored",
      ]
    `)
    expect(stdout2).toMatchInlineSnapshot(`
      [
        "[33m/test/github.com/repom[39m",
      ]
    `)
  })

  it('showMoveDiff', async () => {
    showMoveDiff('/test/github.com', '/test/github.com2', [
      { oldPath: '/test/github.com/repom', newPath: '/test/github.com2/repom' },
      { oldPath: '/test/github.com/repom2', newPath: '/test/github.com2/repom2' },
    ])
    // @ts-expect-error test only
    const stdout = logger.log.mock.calls.map((args: any[]) => args[0]) as string[]
    expect(stdout).toMatchInlineSnapshot(`
      [
        "",
        "clean up 📂[96m/test/github.com[39m repositories into 📂[96m/test/github.com2[39m",
        "[31m/repom [39m  [32m->[39m  [33m[90m/test/github.com[39m[33m[92m2/repom[39m[33m[39m",
        "[31m/repom2[39m  [32m->[39m  [33m[90m/test/github.com[39m[33m[92m2/repom2[39m[33m[39m",
      ]
    `)
  })
})
