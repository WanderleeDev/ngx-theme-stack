/** Built-in themes. All other values are considered custom themes. */
export const DEFAULT_THEMES = ['light', 'dark', 'system'] as const;

/** String union with autocompletion for defaults + any string support for customization. */
export type NgTheme = (typeof DEFAULT_THEMES)[number] | (string & {});

export type NgSystemTheme = Exclude<NgTheme, 'system'>;
export type NgMode = 'attribute' | 'class' | 'both';

export interface NgConfig {
  theme: NgTheme;
  storageKey: string;
  mode: NgMode;
  themes: NgTheme[];
}
