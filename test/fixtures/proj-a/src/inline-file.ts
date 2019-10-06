import { $INLINE_FILE } from 'ts-transformer-inline-file'

const foo = $INLINE_FILE('./words.txt').split(' ')

console.log(foo)
