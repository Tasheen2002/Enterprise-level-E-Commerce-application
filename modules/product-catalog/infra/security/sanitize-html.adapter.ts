import sanitizeHtml from "sanitize-html";
import { IHtmlSanitizer } from "../../application/services/ihtml-sanitizer.service";

// Whitelist of tags allowed in editorial HTML. Block-level + inline formatting
// + lists + safe media. Scripts, iframes, forms, embeds, style/link tags are
// intentionally excluded.
const ALLOWED_TAGS: readonly string[] = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr", "div", "span",
  "strong", "em", "b", "i", "u", "s",
  "blockquote", "code", "pre",
  "ul", "ol", "li",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
];

// Per-tag allowed attributes. `*: []` is implicit — anything not listed is stripped.
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  th: ["colspan", "rowspan", "scope"],
  td: ["colspan", "rowspan"],
  // No global attributes (id, class, style) — strips XSS vectors via CSS.
};

// Only safe URL schemes. Crucially excludes javascript:, vbscript:, data:.
const ALLOWED_SCHEMES: readonly string[] = ["http", "https", "mailto", "tel"];
const ALLOWED_SCHEMES_BY_TAG: Record<string, string[]> = {
  img: ["http", "https"],
};

const HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS as string[],
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedSchemes: ALLOWED_SCHEMES as string[],
  allowedSchemesByTag: ALLOWED_SCHEMES_BY_TAG,
  allowProtocolRelative: false,
  // External link safety — force noopener/noreferrer.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
  },
  // Strip script/style/etc. content entirely (don't leave inline JS as text).
  disallowedTagsMode: "discard",
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
};

const TITLE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

export class SanitizeHtmlAdapter implements IHtmlSanitizer {
  sanitizeTitle(title: string): string {
    return sanitizeHtml(title, TITLE_OPTIONS).trim();
  }

  sanitize(html: string): string {
    return sanitizeHtml(html, HTML_OPTIONS);
  }
}
