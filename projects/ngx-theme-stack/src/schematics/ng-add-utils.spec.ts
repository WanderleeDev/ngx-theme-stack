import { HostTree } from '@angular-devkit/schematics';
import {
  assertAngularProject,
  buildProvideCall,
  detectPackageManager,
  looksLikeNestMain,
  parseYesNo,
} from '../../schematics/ng-add/utils';

describe('parseYesNo', () => {
  it('accepts y and yes, in any case', () => {
    for (const answer of ['y', 'Y', 'yes', 'YES', 'Yes', ' y ']) {
      expect(parseYesNo(answer, false)).toBe(true);
    }
  });

  it('accepts n and no, in any case', () => {
    for (const answer of ['n', 'N', 'no', 'NO', 'No', ' n ']) {
      expect(parseYesNo(answer, true)).toBe(false);
    }
  });

  it('takes the prompt default on an empty answer', () => {
    expect(parseYesNo('', true)).toBe(true);
    expect(parseYesNo('   ', true)).toBe(true);
    expect(parseYesNo('', false)).toBe(false);
  });

  it('returns undefined for anything unrecognised, instead of guessing', () => {
    // The agent-skill prompt used `input !== 'n'`, so a typo counted as "yes".
    for (const answer of ['asdf', 'sí', 'si', 'yep', 'maybe', '1', '0', 'nope']) {
      expect(parseYesNo(answer, true)).toBeUndefined();
    }
  });
});

describe('looksLikeNestMain', () => {
  it('detects a NestJS import', () => {
    expect(looksLikeNestMain("import { NestFactory } from '@nestjs/core';")).toBe(true);
  });

  it('detects NestFactory.create', () => {
    expect(looksLikeNestMain('const app = await NestFactory.create(AppModule);')).toBe(true);
  });

  it('rejects an Angular bootstrap', () => {
    expect(
      looksLikeNestMain(
        "import { bootstrapApplication } from '@angular/platform-browser';",
      ),
    ).toBe(false);
  });

  it('rejects empty or missing content', () => {
    expect(looksLikeNestMain('')).toBe(false);
    expect(looksLikeNestMain(null)).toBe(false);
    expect(looksLikeNestMain(undefined)).toBe(false);
  });
});

describe('assertAngularProject', () => {
  it('throws an actionable error for a NestJS main.ts', () => {
    const tree = new HostTree();
    tree.create(
      'src/main.ts',
      "import { NestFactory } from '@nestjs/core';\nNestFactory.create(AppModule);",
    );
    expect(() => assertAngularProject(tree, 'src', 'backend')).toThrow(
      /"backend" looks like a NestJS application/,
    );
  });

  it('passes for an Angular main.ts', () => {
    const tree = new HostTree();
    tree.create(
      'src/main.ts',
      "import { bootstrapApplication } from '@angular/platform-browser';",
    );
    expect(() => assertAngularProject(tree, 'src', 'frontend')).not.toThrow();
  });

  it('passes when main.ts is missing (guard is best-effort)', () => {
    expect(() => assertAngularProject(new HostTree(), 'src', 'frontend')).not.toThrow();
  });
});

describe('buildProvideCall', () => {
  it('renders string themes as plain quotes', () => {
    const call = buildProvideCall('system', 'key', 'class', ['system', 'light', 'dark'], 'critters');
    expect(call).toContain("themes: ['system', 'light', 'dark'] as const");
    expect(call).not.toContain('scheme');
  });

  it('renders object-form entries when schemeMap is provided', () => {
    const call = buildProvideCall(
      'system', 'key', 'class',
      ['system', 'light', 'dark', 'sepia'],
      'critters',
      { sepia: 'light' },
    );
    expect(call).toContain("{ name: 'sepia', scheme: 'light' }");
    expect(call).toContain("'system'");
    expect(call).toContain("'light'");
  });

  it('leaves entries without a schemeMap entry as plain strings', () => {
    const call = buildProvideCall(
      'system', 'key', 'class',
      ['system', 'light', 'dark', 'sepia', 'ocean'],
      'critters',
      { sepia: 'light' },
    );
    expect(call).toContain("{ name: 'sepia', scheme: 'light' }");
    expect(call).toContain("'ocean'");
  });
});

describe('detectPackageManager', () => {
  it('reads the packageManager field', () => {
    const tree = new HostTree();
    tree.create('/package.json', JSON.stringify({ packageManager: 'pnpm@11.3.0' }));
    expect(detectPackageManager(tree)).toBe('pnpm');
  });

  it('reads the packageManager field for yarn', () => {
    const tree = new HostTree();
    tree.create('/package.json', JSON.stringify({ packageManager: 'yarn@4.1.0' }));
    expect(detectPackageManager(tree)).toBe('yarn');
  });

  it('falls back to pnpm-lock.yaml', () => {
    const tree = new HostTree();
    tree.create('pnpm-lock.yaml', 'lockfileVersion: 9.0');
    expect(detectPackageManager(tree)).toBe('pnpm');
  });

  it('falls back to package-lock.json', () => {
    const tree = new HostTree();
    tree.create('package-lock.json', '{}');
    expect(detectPackageManager(tree)).toBe('npm');
  });

  it('defaults to npm without any signal', () => {
    expect(detectPackageManager(new HostTree())).toBe('npm');
  });
});
