export interface Schema {
  /** Name of the Angular project to configure. */
  project: string;
  /** 'quick' applies defaults silently. 'custom' prompts interactively. */
  mode: 'quick' | 'custom';
  /** The strategy to prevent theme flicker. */
  strategy: 'critters' | 'blocking';
}
