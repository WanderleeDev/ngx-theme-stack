import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import * as ts from 'typescript';

/**
 * Patches the application configuration to include or update the theme stack provider.
 * Uses a hybrid approach:
 * 1. Attempts the official 'addRootProvider' for standard standalone apps.
 * 2. If it fails or if the provider already exists, it uses a smart AST walker
 *    to either inject or UPDATE the existing configuration.
 */
export async function patchAppConfig(
  tree: Tree,
  context: SchematicContext,
  projectSourceRoot: string,
  provideCall: string,
  projectName?: string,
): Promise<void> {
  const mainPath = `${projectSourceRoot}/main.ts`.replace(/^\//, '');
  const appConfigPath = `${projectSourceRoot}/app/app.config.ts`.replace(/^\//, '');

  const startFile = tree.exists(appConfigPath) ? appConfigPath : tree.exists(mainPath) ? mainPath : null;

  if (!startFile) {
    context.logger.warn('⚠ Could not find app.config.ts or main.ts. Please add provideThemeStack() manually.');
    return;
  }

  // Check if already present to decide between "Inject" or "Update"
  const content = tree.read(startFile)?.toString() || '';
  const alreadyHasProvider = content.includes('provideThemeStack');

  // ── Strategy 1: Standard addRootProvider (Only if NOT already present) ─────
  if (projectName && !alreadyHasProvider) {
    try {
      const rule: Rule = addRootProvider(projectName, ({ code, external }) =>
        code`${external('provideThemeStack', 'ngx-theme-stack')}(${provideCall.replace(/^provideThemeStack\(/, '').replace(/\)$/, '')})`,
      );
      await Promise.resolve((rule as (t: Tree, ctx: SchematicContext) => unknown)(tree, context));
      
      // Re-read content to see if it worked
      const updatedContent = tree.read(startFile)?.toString() || '';
      if (updatedContent.includes('provideThemeStack')) return;
    } catch (e) {
      context.logger.debug(`Standard addRootProvider failed: ${String(e)}`);
    }
  }

  // ── Strategy 2: Smart AST Patching / Updating ─────────────────────────────
  // This will handle both "Delegated Providers" and "Updates to existing config"
  if (await applySmartPatch(tree, context, startFile, provideCall)) {
    return;
  }

  context.logger.warn(`⚠ Could not automatically inject or update provider in ${startFile}.`);
}

/**
 * Recursively follows identifiers to find where the providers array is defined
 * or where provideThemeStack is already called.
 */
async function applySmartPatch(
  tree: Tree,
  context: SchematicContext,
  filePath: string,
  provideCall: string,
  targetIdentifier?: string,
  visitedFiles = new Set<string>()
): Promise<boolean> {
  if (visitedFiles.has(filePath)) return false;
  visitedFiles.add(filePath);

  const buffer = tree.read(filePath);
  if (!buffer) return false;
  
  const content = buffer.toString();
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  // A. UPDATE: If provideThemeStack is already here, replace it.
  const existingCall = findProvideThemeStackCall(sourceFile);
  if (existingCall) {
    const updated = content.slice(0, existingCall.getStart()) + provideCall + content.slice(existingCall.getEnd());
    tree.overwrite(filePath, updated);
    ensureImport(tree, filePath, 'provideThemeStack', 'ngx-theme-stack');
    return true;
  }

  // B. INJECT: If we have a targetIdentifier, look for its variable declaration
  if (targetIdentifier) {
    const variableDeclaration = findVariableDeclaration(sourceFile, targetIdentifier);
    if (variableDeclaration && variableDeclaration.initializer && ts.isArrayLiteralExpression(variableDeclaration.initializer)) {
      insertIntoArray(tree, filePath, variableDeclaration.initializer, provideCall);
      ensureImport(tree, filePath, 'provideThemeStack', 'ngx-theme-stack');
      return true;
    }
  }

  // C. INJECT: Look for a providers array literal: providers: [ ... ]
  const arrayLiteral = findProvidersArrayLiteral(sourceFile);
  if (arrayLiteral) {
    insertIntoArray(tree, filePath, arrayLiteral, provideCall);
    ensureImport(tree, filePath, 'provideThemeStack', 'ngx-theme-stack');
    return true;
  }

  // D. DELEGATION: Look for a delegated provider: providers: SOME_CONSTANT
  const delegatedIdentifier = findProvidersIdentifier(sourceFile);
  if (delegatedIdentifier) {
    const importPath = findImportPathForIdentifier(sourceFile, delegatedIdentifier);
    if (importPath) {
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      let resolvedPath = `${dir}/${importPath}.ts`.replace(/\/\/+/g, '/').replace(/\.ts\.ts$/, '.ts');
      if (!tree.exists(resolvedPath)) {
         resolvedPath = `${dir}/${importPath}/index.ts`.replace(/\/\/+/g, '/');
      }

      if (tree.exists(resolvedPath)) {
        return applySmartPatch(tree, context, resolvedPath, provideCall, delegatedIdentifier, visitedFiles);
      }
    } else {
      const variableDeclaration = findVariableDeclaration(sourceFile, delegatedIdentifier);
      if (variableDeclaration && variableDeclaration.initializer && ts.isArrayLiteralExpression(variableDeclaration.initializer)) {
        insertIntoArray(tree, filePath, variableDeclaration.initializer, provideCall);
        ensureImport(tree, filePath, 'provideThemeStack', 'ngx-theme-stack');
        return true;
      }
    }
  }

  return false;
}

function findProvideThemeStackCall(node: ts.Node): ts.CallExpression | null {
  let result: ts.CallExpression | null = null;
  function visit(n: ts.Node) {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'provideThemeStack') {
      result = n;
    }
    if (!result) ts.forEachChild(n, visit);
  }
  visit(node);
  return result;
}

function findProvidersArrayLiteral(node: ts.Node): ts.ArrayLiteralExpression | null {
  let result: ts.ArrayLiteralExpression | null = null;
  function visit(n: ts.Node) {
    if (ts.isPropertyAssignment(n) && ts.isIdentifier(n.name) && n.name.text === 'providers') {
      if (ts.isArrayLiteralExpression(n.initializer)) {
        result = n.initializer;
      }
    }
    if (!result) ts.forEachChild(n, visit);
  }
  visit(node);
  return result;
}

function findProvidersIdentifier(node: ts.Node): string | null {
  let result: string | null = null;
  function visit(n: ts.Node) {
    if (ts.isPropertyAssignment(n) && ts.isIdentifier(n.name) && n.name.text === 'providers') {
      if (ts.isIdentifier(n.initializer)) {
        result = n.initializer.text;
      }
    }
    if (!result) ts.forEachChild(n, visit);
  }
  visit(node);
  return result;
}

function findImportPathForIdentifier(sourceFile: ts.SourceFile, identifier: string): string | null {
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
      if (statement.importClause.namedBindings.elements.some(e => e.name.text === identifier)) {
        return (statement.moduleSpecifier as ts.StringLiteral).text;
      }
    }
  }
  return null;
}

function findVariableDeclaration(sourceFile: ts.SourceFile, identifier: string): ts.VariableDeclaration | null {
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === identifier) {
          return decl;
        }
      }
    }
  }
  return null;
}

function insertIntoArray(tree: Tree, filePath: string, array: ts.ArrayLiteralExpression, text: string) {
  const content = tree.read(filePath)!.toString();
  const insertionPos = array.elements.length > 0 
    ? array.elements[array.elements.length - 1].getEnd() 
    : array.getStart() + 1;
  const prefix = array.elements.length > 0 ? ', ' : '';
  const updated = content.slice(0, insertionPos) + prefix + text + content.slice(insertionPos);
  tree.overwrite(filePath, updated);
}

function ensureImport(tree: Tree, filePath: string, symbol: string, module: string) {
  const content = tree.read(filePath)!.toString();
  
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const importFound = sourceFile.statements.some(s => 
    ts.isImportDeclaration(s) && 
    ts.isStringLiteral(s.moduleSpecifier) && 
    s.moduleSpecifier.text === module &&
    s.importClause?.namedBindings &&
    ts.isNamedImports(s.importClause.namedBindings) &&
    s.importClause.namedBindings.elements.some(e => e.name.text === symbol)
  );

  if (importFound) return;

  const moduleImportRegex = new RegExp(`import\\s*{([^}]*)}\\s*from\\s*['"]${module}['"]`);
  const match = moduleImportRegex.exec(content);
  
  if (match) {
    const existingSymbols = match[1].trim();
    const updatedSymbols = existingSymbols ? `${existingSymbols}, ${symbol}` : symbol;
    const updated = content.replace(match[0], `import { ${updatedSymbols} } from '${module}'`);
    tree.overwrite(filePath, updated);
  } else {
    const updated = `import { ${symbol} } from '${module}';\n` + content;
    tree.overwrite(filePath, updated);
  }
}

