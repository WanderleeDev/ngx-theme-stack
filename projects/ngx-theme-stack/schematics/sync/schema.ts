export interface Schema {
  /** Name of the Angular project to sync. */
  project: string;
  /** The strategy to prevent theme flicker. */
  strategy: 'critters' | 'blocking';
}
