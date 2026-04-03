/** Options passed to the ng-add schematic by the Angular CLI. */
export interface Schema {
  /** Name of the Angular project to configure. */
  project: string;

  /**
   * Installation mode:
   * - 'quick'  → apply defaults immediately, no further questions
   * - 'custom' → prompt the user for each individual option
   */
  mode: 'quick' | 'custom';

  /** Default theme applied on startup. Only used in custom mode. */
  theme: 'system' | 'light' | 'dark' | string;

  /** localStorage key used to persist the theme. Only used in custom mode. */
  storageKey: string;

  /** Strategy used to apply the theme to the <html> element. Only used in custom mode. */
  themeMode: 'class' | 'attribute' | 'both';
}
