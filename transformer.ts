import * as fs from 'fs'
import * as path from 'path'
import ts from 'typescript'


const stubModuleSource = fs.readFileSync(path.join(__dirname, 'index.d.ts'), 'utf8')


export default function transformer (program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context) => (source) => visitNodeAndChildren(source, program, context)
}

function visitNodeAndChildren (node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile
function visitNodeAndChildren (node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node
function visitNodeAndChildren (node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
  return ts.visitEachChild(
    visitNode(node, program),
    (childNode) => visitNodeAndChildren(childNode, program, context),
    context,
  )
}

function visitNode (node: ts.Node, program: ts.Program): ts.Node {
  if (!ts.isCallExpression(node)) {
    return node
  }
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

  const funcName = declaration.name && declaration.name.getText()
  if (!funcName) {
    return node
  }

  return handleInlineCallExpression(node, funcName)
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
      return ts.createStringLiteral(content)
    }
    case '$INLINE_JSON': {
      const parent = node.parent
      let obj = JSON.parse(content)

      if (ts.isVariableDeclaration(parent) && ts.isObjectBindingPattern(parent.name)) {
        if (typeof obj !== 'object') {
          throw TypeError(`${filename} does not contain an object as expected`)
        }
        obj = filterObjectByBindingPattern(obj, parent.name)
      }
      return createJSONParseCall(JSON.stringify(obj))
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

function filterObjectByBindingPattern (obj: any, binding: ts.ObjectBindingPattern): any {
  return binding.elements.reduce((acc, { propertyName, name }) => {
    const propName = propertyName && ts.isIdentifier(propertyName) ? propertyName.text
      : ts.isIdentifier(name) ? name.text
      : undefined
    if (propName) {
      acc[propName] = obj[propName]
    }
    return acc
  }, {} as any)
}

function createJSONParseCall (arg0: string): ts.CallExpression {
  return ts.createCall(
    ts.createPropertyAccess(
      ts.createIdentifier('JSON'),
      ts.createIdentifier('parse'),
    ),
    undefined,
    [ts.createStringLiteral(arg0)],
  )
}
