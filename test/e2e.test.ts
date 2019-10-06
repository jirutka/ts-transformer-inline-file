import './support/tapeExtensions'

import { execSync as exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import test from 'tape'


const fixtureDir = path.join(__dirname, 'fixtures/proj-a')
const pkgName = 'ts-transformer-inline-file'

const readFile = (filename: string) => fs.readFileSync(filename, 'utf8')


test('build fixture project', t => {
  process.chdir(fixtureDir)

  exec('yarn install', { stdio: 'inherit' })
  exec('yarn clean', { stdio: 'inherit' })
  exec('yarn build', { stdio: 'inherit' })

  t.assert(fs.existsSync('./lib'), 'the outDir was created')

  t.end()
})

test('$INLINE_FILE', t => {
  const source = readFile('./lib/inline-file.js')

  t.notIncludes(source, '$INLINE_FILE')
  t.includes(source, "foo = \"lorem ipsum dolor\\n\".split(' ')")

  t.notIncludes(source, `require("${pkgName}")`)

  t.end()
})

test('$INLINE_JSON', t => {
  const source = readFile('./lib/inline-json.js')

  t.notIncludes(source, '$INLINE_JSON')
  t.includes(source, 'foo = { "str": "lol", "num-x": 42, "ary": ["foo", false], "obj": { "a": null } }')

  t.notIncludes(source, `require("${pkgName}")`)

  t.end()
})

test('$INLINE_JSON with object destructuring', t => {
  const source = readFile('./lib/inline-json-obj-destructuring.js')

  t.notIncludes(source, '$INLINE_JSON')
  t.includes(source, '{ name, version: VER } = { "name": "fixture-package", "version": "0.1.0" }')

  t.notIncludes(source, `require("${pkgName}")`)

  t.end()
})
