import { $INLINE_JSON } from 'ts-transformer-inline-file'

const { name, version: VER } = $INLINE_JSON('../package.json')

console.log(name, VER)
