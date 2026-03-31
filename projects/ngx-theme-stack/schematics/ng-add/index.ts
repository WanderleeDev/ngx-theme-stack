import {
  Rule,
  SchematicsException,
  Tree,
  chain,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { input, select } from '@inquirer/prompts';

interface SchemaOptions {
  setupMode: string;
  storageKey: string;
  defaultTheme: string;
  mode: string;
  themes: string[];
}

/**
 * Returns the minified script to be injected into index.html.
 * Inspired by next-themes to prevent flickering.
 */
function getBlockingScript(options: SchemaOptions) {
  const allThemes = Array.from(new Set(['light', 'dark', 'system', ...(options.themes || [])]));
  const themesJson = JSON.stringify(allThemes);

  const script = `
    (function() {
      try {
        var k = '${options.storageKey}';
        var d = '${options.defaultTheme}';
        var m = '${options.mode}';
        var ths = ${themesJson};
        var s = localStorage.getItem(k);
        var t = s || d;
        if (t === 'system') {
          t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        var el = document.documentElement;
        if (m === 'class' || m === 'both') {
          for (var i = 0; i < ths.length; i++) {
            el.classList.remove(ths[i]);
          }
          el.classList.add(t);
        }
        if (m === 'attribute' || m === 'both') {
          el.setAttribute('data-theme', t);
        }
        if (t === 'dark' || t === 'light') {
          el.style.setProperty('color-scheme', t);
        }
      } catch (e) {}
    })();
  `;
  return script.replace(/\n\s*/g, '').trim();
}

/**
 * Injects the theme detection script into the index.html file of the project.
 */
function injectScript(options: SchemaOptions): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree);
    const projects = workspace.projects;

    projects.forEach((project) => {
      if (project.extensions['projectType'] !== 'application') {
        return;
      }

      const buildTarget = project.targets.get('build');
      const options_ = buildTarget?.options;
      if (!options_) {
        return;
      }

      const indexHtmlPath = options_['index'] as string;
      if (!indexHtmlPath || !tree.exists(indexHtmlPath)) {
        return;
      }

      const content = tree.readText(indexHtmlPath);
      const scriptId = 'ngx-theme-stack-initial';

      if (content.includes(scriptId)) {
        return;
      }

      const scriptTag = `<script id="${scriptId}">${getBlockingScript(options)}</script>`;
      const headEndIndex = content.indexOf('</head>');

      if (headEndIndex === -1) {
        throw new SchematicsException(`Could not find </head> tag in ${indexHtmlPath}`);
      }

      const updatedContent =
        content.slice(0, headEndIndex) + scriptTag + content.slice(headEndIndex);

      tree.overwrite(indexHtmlPath, updatedContent);
    });
  };
}


/**
 * Main schematic rule for ng-add.
 */
export function ngAdd(options: SchemaOptions): Rule {
  return async () => {
    await askQuestions(options);
    return chain([injectScript(options)]);
  };
}

/**
 * Asks interactive questions only in "custom" mode.
 * In "quick" mode, schema.json defaults are used as-is.
 *
 * Note: `@inquirer/prompts` is a transitive dependency of `@angular/cli`,
 * so it is available in any project using `ng add`.
 */
async function askQuestions(options: SchemaOptions) {
  if (options.setupMode === 'custom') {
    options.storageKey = await input({
      message: 'Which key would you like to use for localStorage?',
      default: options.storageKey || 'ngx-theme-stack-theme',
    });

    options.mode = await select({
      message: 'How should the theme be applied to the DOM?',
      choices: [
        { value: 'class', name: 'CSS Class (.dark/.light)' },
        { value: 'attribute', name: 'Data Attribute (data-theme)' },
        { value: 'both', name: 'Both' },
      ],
      default: (options.mode as string) || 'class',
    });

    const customThemes = await input({
      message: 'Add custom themes? (comma-separated, e.g. "sepia, ocean") — press Enter to skip:',
      default: '',
    });

    // Parse and merge custom themes with defaults
    const parsed = customThemes
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    options.themes = Array.from(new Set(['light', 'dark', 'system', ...parsed]));

    // Build choices for defaultTheme including any custom themes
    const defaultChoices = [
      { value: 'system', name: 'System (OS Preference)' },
      { value: 'dark', name: 'Dark' },
      { value: 'light', name: 'Light' },
      ...parsed.map((t) => ({ value: t, name: t.charAt(0).toUpperCase() + t.slice(1) })),
    ];

    options.defaultTheme = await select({
      message: 'Which should be the default theme?',
      choices: defaultChoices,
      default: (options.defaultTheme as string) || 'system',
    });

    return;
  }

  // Quick mode: merge themes with defaults
  options.themes = Array.from(new Set(['light', 'dark', 'system', ...(options.themes || [])]));
}
