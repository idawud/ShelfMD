import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import type { Token } from 'markdown-it';

// Lazy-loaded heavy deps
let katexLoaded = false;
let mermaidLoaded = false;

export function createMarkdownRenderer(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
          return `<pre class="hljs-pre" data-lang="${lang}"><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        } catch {}
      }
      return `<pre class="hljs-pre"><code class="hljs">${md.utils.escapeHtml(code)}</code></pre>`;
    }
  });

  // Source position tracking (for reading memory)
  md.core.ruler.push('source_pos', (state) => {
    for (const token of state.tokens) {
      if (token.map) {
        token.attrSet('data-sourcepos', `${token.map[0]}:${token.map[1]}`);
      }
    }
  });

  // Mark internal (local) links with data-internal attribute
  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens: Token[], idx: number, options: unknown, _env: unknown, self: MarkdownIt['renderer']) => {
    return (self as MarkdownIt['renderer']).renderToken(tokens, idx, options as Parameters<MarkdownIt['renderer']['renderToken']>[2]);
  });

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = token.attrGet('href') || '';

    // Mark internal links (relative or root-relative, not http/https/mailto)
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
      token.attrSet('data-internal', 'true');
    }

    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  return md;
}

export async function renderMarkdown(content: string): Promise<string> {
  const md = createMarkdownRenderer();
  const rendered = md.render(content);

  // Sanitize HTML (DOMPurify in browser context)
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>)['DOMPurify']) {
    return ((window as unknown as Record<string, unknown>)['DOMPurify'] as {
      sanitize: (html: string, opts: object) => string
    }).sanitize(rendered, {
      ADD_TAGS: ['math', 'annotation', 'semantics', 'mrow', 'mn', 'mi', 'mo', 'msup', 'msub'],
      ADD_ATTR: ['data-sourcepos', 'data-internal', 'data-lang', 'data-math-display', 'xmlns']
    });
  }

  return rendered;
}

// GitHub heading slug algorithm
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractHeadings(content: string): Array<{level: number; text: string; slug: string; line: number}> {
  const headings: Array<{level: number; text: string; slug: string; line: number}> = [];
  const slugCounts: Record<string, number> = {};
  const lines = content.split('\n');

  lines.forEach((line, lineNum) => {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      let slug = slugify(text);

      if (slugCounts[slug] !== undefined) {
        slugCounts[slug]++;
        slug = `${slug}-${slugCounts[slug]}`;
      } else {
        slugCounts[slug] = 0;
      }

      headings.push({ level, text, slug, line: lineNum });
    }
  });

  return headings;
}
