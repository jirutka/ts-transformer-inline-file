import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'


const stubModuleSource = fs.readFileSync(path.join(__dirname, 'index.d.ts'), 'utf8')


export default function transformer (program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context) => (source) => visitNodeAndChildren(source, program, context)
}

function visitNodeAndChildren (node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile
function visitNodeAndChildren (node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.VisitResult<ts.Node>
function visitNodeAndChildren (node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.VisitResult<ts.Node> {
  const newNode = visitNode(node, program)

  return newNode
    ? ts.visitEachChild(newNode, (child) => visitNodeAndChildren(child, program, context), context)
    : undefined
}

function visitNode (node: ts.Node, program: ts.Program): ts.Node | undefined {
  try {
    if (ts.isCallExpression(node)) {
      return visitCallExpression(node, program)
    }
    if (ts.isImportDeclaration(node)) {
      return visitImportClause(node, program)
    }
    return node

  } catch (err) {
    if (err instanceof Error) {
      enhanceErrorStack(err, node)
    }
    throw err
  }
}

function visitCallExpression (node: ts.CallExpression, program: ts.Program): ts.Node {
  const typeChecker = program.getTypeChecker()

  const signature = typeChecker.getResolvedSignature(node)
  if (!signature) {
    return node
  }

  const { declaration } = signature
  if (!declaration
      || ts.isJSDocSignature(declaration)
      || !isOurStubModule(declaration.getSourceFile())) {
    return node
  }

  const funcName = declaration.name?.getText()
  if (!funcName) {
    return node
  }

  return handleInlineCallExpression(node, funcName)
}

function visitImportClause (node: ts.ImportDeclaration, program: ts.Program): ts.Node | undefined {
  if (!node.importClause) {
    return node
  }

  const namedBindings = node.importClause.namedBindings
  if (!node.importClause.name && !namedBindings) {
    return node
  }

  const importSymbol = program.getTypeChecker().getSymbolAtLocation(node.moduleSpecifier)
  if (!importSymbol?.valueDeclaration || !isOurStubModule(importSymbol.valueDeclaration.getSourceFile())) {
    return node
  }

  return undefined  // drop the import
}

function handleInlineCallExpression (node: ts.CallExpression, funcName: string): ts.Node {
  const arg0 = node.arguments[0]

  if (!arg0 || !ts.isStringLiteral(arg0)) {
    throw TypeError(`The first argument of ${funcName} function must be a string literal`)
  }
  const filename = arg0.text

  const baseDir = path.dirname(node.getSourceFile().fileName)
  const content = fs.readFileSync(path.resolve(baseDir, filename), 'utf-8')

  switch (funcName) {
    case '$INLINE_FILE': {
      return ts.factory.createStringLiteral(content)
    }
    case '$INLINE_JSON': {
      const parent = node.parent
      let obj: unknown = JSON.parse(content)

      if (ts.isVariableDeclaration(parent) && ts.isObjectBindingPattern(parent.name)) {
        if (typeof obj !== 'object') {
          throw TypeError(`${filename} does not contain an object as expected`)
        }
        if (obj !== null) {
          obj = filterObjectByBindingPattern(obj, parent.name)
        }
      }
      return jsonToAST(obj)
    }
    default: {
      throw RangeError(`Unknown function: ${funcName}`)
    }
  }
}

function isOurStubModule (sourceFile: ts.SourceFile): boolean {
  // Comparing of the file names may not be reliable, it doesn't work e.g. with
  // yarn's "link" resolution used in this module's end-to-end tests.
  return sourceFile.text === stubModuleSource
}

function filterObjectByBindingPattern (obj: object, binding: ts.ObjectBindingPattern): any {
  return binding.elements.reduce<Record<string, unknown>>((acc, { propertyName, name }) => {
    const propName = propertyName && ts.isIdentifier(propertyName) ? propertyName.text
      : ts.isIdentifier(name) ? name.text
      : undefined
    if (propName) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      acc[propName] = (obj as any)[propName]
    }
    return acc
  }, {})
}

function jsonToAST (obj: unknown): ts.Expression {
  switch (typeof obj) {
    case 'object': {
      if (obj === null) {
        return ts.factory.createNull()
      }
      if (Array.isArray(obj)) {
        return ts.factory.createArrayLiteralExpression(obj.map(jsonToAST))
      }
      return ts.factory.createObjectLiteralExpression(Object.keys(obj).map(key => {
        const propName = ts.factory.createStringLiteral(key)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return ts.factory.createPropertyAssignment(propName, jsonToAST((obj as any)[key]))
      }))
    }
    case 'number': return ts.factory.createNumericLiteral(obj)
    case 'boolean': return obj ? ts.factory.createTrue() : ts.factory.createFalse()
    case 'string': return ts.factory.createStringLiteral(obj, /* isSingleQuote */ undefined)
    default: throw TypeError(`Unexpected type in JSON object: "${String(obj)}" (${typeof obj})`)
  }
}

function enhanceErrorStack (err: Error, node: ts.Node): void {
  if (err.stack == null) { return }

  const lines = err.stack.split('\n')
  const line1 = lines[1] || ''
  const indent = ' '.repeat(line1.length - line1.trimStart().length)

  const source = node.getSourceFile()
  const loc = ts.getLineAndCharacterOfPosition(source, node.pos)
  const newLine = `${indent}at ${source.fileName}:${loc.line + 1}:${loc.character + 1}`

  lines.splice(1, 0, newLine)
  err.stack = lines.join('\n')
}
