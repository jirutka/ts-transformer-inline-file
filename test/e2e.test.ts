import './support/tapeExtensions'

import { execSync as exec } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import test from 'tape'


const fixtureDir = path.join(__dirname, 'fixtures/proj-a')

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

  t.end()
})
