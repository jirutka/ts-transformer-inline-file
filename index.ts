/**
 * Includes (inlines) content of the specified file into the source file.
 * Call of this function will be replaced with the file's content by
 * the TypeScript transformer.
 *
 * @param filename The path of the file to include (relative to the caller file).
 * @return A content of the *filename*.
 */
export declare function $INLINE_FILE (filename: string): string

/**
 * Includes (inline) normalized content of the specified JSON file wrapped in
 * `JSON.parse` call.
 *
 * Call of this function will be replaced with `JSON.parse(<content>)` where
 * `<content>` is normalized (using `JSON.parse -> JSON.stringify`) JSON content
 * of the *filename*.
 *
 * @param filename The path of the JSON file to include (relative to the caller file).
 * @return A parsed JSON object.
 * @template R is the return type.
 */
export declare function $INLINE_JSON <R = any> (filename: string): R
