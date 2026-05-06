export interface IHtmlSanitizer {
  /**
   * Sanitize a plain-text title — strips ALL HTML tags and dangerous protocols,
   * returning safe display text.
   */
  sanitizeTitle(title: string): string;

  /**
   * Sanitize editorial HTML — allows a curated set of formatting tags and
   * attributes, strips everything else (scripts, iframes, dangerous protocols,
   * event handlers, style/CSS attacks).
   */
  sanitize(html: string): string;
}
