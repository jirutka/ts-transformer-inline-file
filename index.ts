/**
 * Includes (inlines) content of the specified file into the source file.
 * Call of this function will be replaced with the file's content by
 * the TypeScript transformer. It will also remove import of this module,
 * so you don't need it in run-time.
 *
 * If the *filename* doesn't exist or couldn't be read, the transformer throws
 * an error in the transpilation (build) phase.
 *
 * NOTE: This function can be used only as a call expression. Any other use
 * results in a runtime error!
 *
 * @example
 *   const words = $INLINE_FILE('../data/words.txt').trim().split(' ')
 *   // will be transformed to:
 *   const words = "lorem ipsum dolor\n".trim().split(" ");
 *   // where "lorem ... \n" is content of the *filename*
 *
 * @param filename The path of the file to include (relative to the caller file).
 * @return A content of the *filename*.
 */
export declare function $INLINE_FILE (filename: string): string

/**
 * Includes (inlines) the specified JSON file as an literal object.
 * Call of this function will be replaced with the foregoing by the TypeScript
 * transformer. It will also remove import of this module, so you don't need
 * it in run-time.
 *
 * If call of this function is directly preceded by an object destructuring
 * assignment, then the object literal will be filtered to contain only the
 * assigned properties (i.e. only these will be inlined). However, this works
 * only for the top level; filtering of nested properties is not supported.
 *
 * If the *filename* doesn't exist or couldn't be read, the transformer throws
 * an error in the transpilation (build) phase.
 *
 * NOTE: This function can be used only as a call expression. Any other use
 * results in a runtime error!
 *
 * @example
 *   const { name, version } = $INLINE_JSON('../package.json')
 *   // will be transformed to:
 *   const { name, version } = { "name": "flynn", "version": "1.0.0" };
 *
 * @param filename The path of the JSON file to include (relative to the caller file).
 * @return A parsed JSON object.
 * @template R is the return type.
 */
export declare function $INLINE_JSON <R = any> (filename: string): R
