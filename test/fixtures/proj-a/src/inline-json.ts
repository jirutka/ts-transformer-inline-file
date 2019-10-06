import { $INLINE_JSON } from 'ts-transformer-inline-file'

const foo = $INLINE_JSON('../config.json')

console.log(foo.name)
