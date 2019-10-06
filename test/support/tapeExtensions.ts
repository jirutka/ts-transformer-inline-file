import { Test } from 'tape'
import { inspect } from 'util'


declare module 'tape' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class Test {
    includes (actual: string | any[], search: any, msg?: string): void
    notIncludes (actual: string | any[], search: any, msg?: string): void

    _assert (ok: any, opts: {[key: string]: any}): void
  }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
Test.prototype.includes = function (actual: string | any[], search: any, msg?: string): void {
  return this._assert(actual.includes(search), {
    message: msg === undefined ? `should include ${inspect(search)}` : msg,
    operator: 'includes',
    expected: search,
    actual,
  })
}

// eslint-disable-next-line @typescript-eslint/unbound-method
Test.prototype.notIncludes = function (actual: string | any[], search: any, msg?: string): void {
  return this._assert(!actual.includes(search), {
    message: msg === undefined ? `should not include ${inspect(search)}` : msg,
    operator: 'notIncludes',
    expected: search,
    actual,
  })
}
