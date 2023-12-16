import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'
import { describe, expect, it, vi } from 'vitest'
import { defaultConfig, normalizeCliWidth, resolveConfig, resolveTargetPath, scanRepo } from 'src/shared'

vi.mock('node:fs/promises')
vi.mock('node:fs')
vi.mock('fast-glob')

describe('shared', () => {
  it('resolveConfig', async () => {
    // should return default config if file does not exist
    vi.mocked(fs.existsSync).mockReturnValueOnce(false)
    const config = await resolveConfig()
    expect(config).toEqual(defaultConfig)
    // should return config if file exists
    vi.mocked(fs.existsSync).mockReturnValueOnce(true)
    vi.mocked(fsp.readFile).mockResolvedValueOnce(JSON.stringify({ baseDir: 'test' }))
    const config2 = await resolveConfig()
    expect(config2).toEqual({ baseDir: 'test' })
  })

  it('resolveTargetPath', () => {
    const repository = 'https://github.com/lhz960904/repom.git'
    const cases = [
      {
        config: { baseDir: '/test', groupBy: { source: true, owner: true } },
        expected: path.normalize('/test/github.com/lhz960904/repom'),
      },
      {
        config: { baseDir: '/test', groupBy: { source: true, owner: true } },
        expected: path.normalize('/test/github.com/lhz960904/repom'),
      },
      {
        config: { baseDir: '/test', groupBy: { source: false, owner: true } },
        expected: path.normalize('/test/lhz960904/repom'),
      },
      {
        config: { baseDir: '/test', groupBy: { source: false, owner: false } },
        expected: path.normalize('/test/repom'),
      },
    ]
    cases.forEach(async ({ config, expected }) => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true)
      vi.mocked(fsp.readFile).mockResolvedValueOnce(JSON.stringify(config))
      const path = await resolveTargetPath(repository)
      expect(path).toEqual(expected)
    })
  })

  it('normalizeCliWidth', () => {
    expect(normalizeCliWidth(['a', 'bb', 'ccc'])).toMatchInlineSnapshot(`
      [
        "a  ",
        "bb ",
        "ccc",
      ]
    `)
  })

  it('scanRepo', () => {
    vi.mocked(fg).mockResolvedValue(['Code/lhz960904/repom'])
    expect(scanRepo('/cwd')).resolves.toEqual([path.normalize('/cwd/Code/lhz960904/repom')])
  })
})
