/**
 * Base error class for `ngx-theme-stack`.
 *
 * Thrown when the library configuration is invalid.
 * Consumers can use `instanceof NgxThemeStackError` to catch only
 * errors originating from this library.
 *
 * @example
 * try {
 *   bootstrapApplication(AppComponent, appConfig);
 * } catch (e) {
 *   if (e instanceof NgxThemeStackError) {
 *     console.error('Bad ngx-theme-stack config:', e.message);
 *   }
 * }
 */
export class NgxThemeStackError extends Error {
  override readonly name = 'NgxThemeStackError';

  constructor(message: string) {
    super(`[ngx-theme-stack] ${message}`);
    // Restore prototype chain (required when targeting ES5 or older)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
