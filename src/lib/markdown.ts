import markdownit, { type MarkdownIt, type Token } from 'markdown-it';
import hljs from 'highlight.js';

// ——— Admonition types ———
const ADMONITION_TYPES: Record<string, { icon: string; cls: string }> = {
  NOTE:      { icon: 'ℹ️', cls: 'admonition-note' },
  TIP:       { icon: '💡', cls: 'admonition-tip' },
  IMPORTANT: { icon: '❗', cls: 'admonition-important' },
  WARNING:   { icon: '⚠️', cls: 'admonition-warning' },
  CAUTION:   { icon: '🚨', cls: 'admonition-caution' },
};

// ——— Front-matter stripper ———
function stripFrontMatter(content: string): string {
  if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
    const end = content.indexOf('\n---', 4);
    if (end !== -1) return content.slice(end + 4).replace(/^\r?\n/, '');
  }
  if (content.startsWith('+++\n')) {
    const end = content.indexOf('\n+++', 4);
    if (end !== -1) return content.slice(end + 4).replace(/^\r?\n/, '');
  }
  return content;
}

// ——— GitHub admonition plugin ———
function admonitionPlugin(md: MarkdownIt): void {
  const RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;
  md.core.ruler.after('inline', 'admonitions', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length - 2; i++) {
      if (tokens[i].type !== 'blockquote_open') continue;
      // Find first paragraph inside blockquote
      let pIdx = i + 1;
      while (pIdx < tokens.length && tokens[pIdx].type !== 'paragraph_open') pIdx++;
      if (pIdx >= tokens.length) continue;
      const inlineToken = tokens[pIdx + 1];
      if (!inlineToken || inlineToken.type !== 'inline') continue;
      const firstChild = inlineToken.children?.[0];
      if (!firstChild || firstChild.type !== 'text') continue;
      const m = firstChild.content.match(RE);
      if (!m) continue;
      const type = m[1].toUpperCase();
      const def = ADMONITION_TYPES[type];
      if (!def) continue;
      // Strip the [!TYPE] prefix from text
      firstChild.content = firstChild.content.slice(m[0].length).trimStart();
      // Add class to blockquote
      tokens[i].attrSet('class', `admonition ${def.cls}`);
      tokens[i].attrSet('data-admonition', type);
      // Prepend icon
      const iconToken = new state.Token('html_block', '', 0);
      iconToken.content = `<div class="admonition-title">${def.icon} ${type.charAt(0) + type.slice(1).toLowerCase()}</div>`;
      tokens.splice(i + 1, 0, iconToken);
      i++; // skip inserted token
    }
  });
}

// ——— Source-position plugin ———
function sourcePosPlugin(md: MarkdownIt): void {
  md.core.ruler.push('source_pos', (state) => {
    for (const token of state.tokens) {
      if (token.map) {
        token.attrSet('data-sourcepos', `${token.map[0]}:${token.map[1]}`);
      }
    }
  });
}

// ——— Internal-link marker ———
function internalLinkPlugin(md: MarkdownIt): void {
  const origRule = md.renderer.rules.link_open;
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = String(token.attrGet('href') ?? '');
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && href !== '') {
      token.attrSet('data-internal', 'true');
    }
    if (href.startsWith('http://') || href.startsWith('https://')) {
      token.attrSet('target', '_blank');
      token.attrSet('rel', 'noopener noreferrer');
    }
    return origRule ? origRule(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
  };
}

// ——— Wiki-link plugin ([[Name]] and [[Name|Label]]) ———
function wikiLinkPlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'wiki_links', (state) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) continue;
      const newChildren: Token[] = [];
      for (const child of blockToken.children) {
        if (child.type !== 'text') { newChildren.push(child); continue; }
        const text = child.content;
        const parts = text.split(/(\[\[[^\]]+\]\])/);
        if (parts.length === 1) { newChildren.push(child); continue; }
        for (const part of parts) {
          const wm = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
          if (wm) {
            const target = wm[1].trim();
            const label = (wm[2] ?? target).trim();
            const open = new state.Token('html_inline', '', 0);
            open.content = `<a href="${md.utils.escapeHtml(target)}" data-internal="true" data-wiki="true">`;
            const txt = new state.Token('text', '', 0);
            txt.content = label;
            const close = new state.Token('html_inline', '', 0);
            close.content = '</a>';
            newChildren.push(open, txt, close);
          } else if (part) {
            const t = new state.Token('text', '', 0);
            t.content = part;
            newChildren.push(t);
          }
        }
      }
      blockToken.children = newChildren;
    }
  });
}

// ——— Task-list plugin (simple inline) ———
function taskListPlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'task_list', (state) => {
    for (let i = 2; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token.type !== 'inline' || !token.children) continue;
      const parent = state.tokens[i - 1];
      if (parent.type !== 'paragraph_open') continue;
      const listParent = state.tokens[i - 2];
      if (listParent.type !== 'list_item_open') continue;
      const firstChild = token.children[0];
      if (!firstChild || firstChild.type !== 'text') continue;
      const m = firstChild.content.match(/^\[([ xX])\]\s*/);
      if (!m) continue;
      const checked = m[1] !== ' ';
      firstChild.content = firstChild.content.slice(m[0].length);
      const chk = new state.Token('html_inline', '', 0);
      chk.content = `<input type="checkbox" class="task-checkbox"${checked ? ' checked' : ''} disabled> `;
      token.children.unshift(chk);
      listParent.attrSet('class', 'task-item');
    }
  });
}

// ——— Footnote plugin (simple) ———
function footnotePlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'footnote_refs', (state) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) continue;
      const newChildren: Token[] = [];
      for (const child of blockToken.children) {
        if (child.type !== 'text') { newChildren.push(child); continue; }
        const parts = child.content.split(/(\[\^[^\]]+\])/g);
        if (parts.length === 1) { newChildren.push(child); continue; }
        for (const part of parts) {
          const fm = part.match(/^\[\^([^\]]+)\]$/);
          if (fm) {
            const id = md.utils.escapeHtml(fm[1]);
            const tok = new state.Token('html_inline', '', 0);
            tok.content = `<sup><a href="#fn-${id}" id="fnref-${id}" class="footnote-ref">[${id}]</a></sup>`;
            newChildren.push(tok);
          } else if (part) {
            const t = new state.Token('text', '', 0);
            t.content = part;
            newChildren.push(t);
          }
        }
      }
      blockToken.children = newChildren;
    }
  });
}

// ——— KaTeX math plugin ———
async function renderKatex(html: string): Promise<string> {
  if (!html.includes('class="math"')) return html;
  try {
    const katex = (await import('katex')).default;
    return html
      .replace(/<span class="math math-inline">([\s\S]*?)<\/span>/g, (_, tex) => {
        try { return katex.renderToString(tex.replace(/&amp;/g, '&'), { throwOnError: false }); }
        catch { return `<span class="math-error">${tex}</span>`; }
      })
      .replace(/<span class="math math-display">([\s\S]*?)<\/span>/g, (_, tex) => {
        try { return katex.renderToString(tex.replace(/&amp;/g, '&'), { throwOnError: false, displayMode: true }); }
        catch { return `<span class="math-error">${tex}</span>`; }
      });
  } catch { return html; }
}

// ——— Math plugin (marks for KaTeX post-process) ———
function mathPlugin(md: MarkdownIt): void {
  // Inline math: $...$
  md.core.ruler.after('inline', 'math_inline', (state) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) continue;
      const newChildren: Token[] = [];
      for (const child of blockToken.children) {
        if (child.type !== 'text') { newChildren.push(child); continue; }
        const parts = child.content.split(/(\$[^$\n]+?\$)/g);
        if (parts.length === 1) { newChildren.push(child); continue; }
        for (const part of parts) {
          if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
            const tok = new state.Token('html_inline', '', 0);
            const inner = md.utils.escapeHtml(part.slice(1, -1));
            tok.content = `<span class="math math-inline">${inner}</span>`;
            newChildren.push(tok);
          } else if (part) {
            const t = new state.Token('text', '', 0);
            t.content = part;
            newChildren.push(t);
          }
        }
      }
      blockToken.children = newChildren;
    }
  });

  // Block math: $$...$$
  md.block.ruler.before('fence', 'math_block', (state, startLine, endLine) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    if (state.src.slice(pos, pos + 2) !== '$$') return false;
    const firstLine = state.src.slice(pos + 2, max).trim();
    let nextLine = startLine + 1;
    let found = false;
    let content = firstLine;
    while (nextLine < endLine) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineEnd = state.eMarks[nextLine];
      const lineText = state.src.slice(lineStart, lineEnd).trim();
      if (lineText === '$$') { found = true; break; }
      content += (content ? '\n' : '') + lineText;
      nextLine++;
    }
    if (!found && firstLine.endsWith('$$')) {
      content = firstLine.slice(0, -2).trim();
      nextLine = startLine;
      found = true;
    }
    if (!found) return false;
    const token = state.push('html_block', '', 0);
    token.map = [startLine, nextLine + 1];
    token.content = `<div class="math math-display">${md.utils.escapeHtml(content)}</div>`;
    state.line = nextLine + 1;
    return true;
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
}

// ——— Code block enhancements (copy button) ———
function codeEnhancePlugin(md: MarkdownIt): void {
  const origFence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = token.info.trim().split(/\s+/)[0] || '';
    const inner = origFence(tokens, idx, options, env, self);
    const langLabel = lang ? `<span class="code-lang">${md.utils.escapeHtml(lang)}</span>` : '';
    return `<div class="code-block" data-lang="${md.utils.escapeHtml(lang)}">
      <div class="code-toolbar">${langLabel}<button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').textContent)">Copy</button></div>
      ${inner}
    </div>`;
  };
}

// ——— Image enhancement (lightbox data attribute) ———
function imagePlugin(md: MarkdownIt): void {
  const origImg = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    token.attrSet('data-lightbox', 'true');
    token.attrSet('loading', 'lazy');
    return origImg ? origImg(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
  };
}

// ——— Main renderer factory ———
let _md: MarkdownIt | null = null;

export function getMarkdownRenderer(): MarkdownIt {
  if (_md) return _md;
  _md = markdownit({
    html: true,
    linkify: true,
    typographer: true,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
        } catch {}
      }
      return _md!.utils.escapeHtml(code);
    }
  });

  _md.use(sourcePosPlugin);
  _md.use(admonitionPlugin);
  _md.use(wikiLinkPlugin);
  _md.use(taskListPlugin);
  _md.use(footnotePlugin);
  _md.use(mathPlugin);
  _md.use(internalLinkPlugin);
  _md.use(codeEnhancePlugin);
  _md.use(imagePlugin);

  return _md;
}

// ——— Mermaid rendering (post-process) ———
async function renderMermaid(html: string): Promise<string> {
  if (!html.includes('language-mermaid')) return html;
  try {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const blocks = temp.querySelectorAll('code.language-mermaid');
    let id = 0;
    for (const block of blocks) {
      const defn = block.textContent ?? '';
      const diagId = `mermaid-${Date.now()}-${id++}`;
      try {
        const { svg } = await mermaid.render(diagId, defn);
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-diagram';
        wrapper.setAttribute('data-zoomable', 'true');
        wrapper.innerHTML = svg;
        block.closest('div.code-block, pre')?.replaceWith(wrapper);
      } catch (e) {
        const err = document.createElement('div');
        err.className = 'mermaid-error';
        err.textContent = `Diagram error: ${e}`;
        block.closest('div.code-block, pre')?.replaceWith(err);
      }
    }
    return temp.innerHTML;
  } catch { return html; }
}

// ——— Sanitize ———
function sanitize(html: string): string {
  if (typeof window === 'undefined') return html;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOMPurify = (window as any).DOMPurify;
    if (DOMPurify) {
      return DOMPurify.sanitize(html, {
        ADD_TAGS: ['math', 'annotation', 'semantics', 'mrow', 'mn', 'mi', 'mo', 'msup', 'msub', 'mfrac', 'msqrt', 'mtable', 'mtr', 'mtd'],
        ADD_ATTR: ['data-sourcepos', 'data-internal', 'data-wiki', 'data-lang', 'data-lightbox', 'data-admonition', 'data-zoomable', 'loading', 'onclick', 'xmlns', 'target', 'rel'],
        FORCE_BODY: false,
      });
    }
  } catch {}
  return html;
}

// ——— Public API ———

export async function renderMarkdown(content: string, imageBasePath?: string): Promise<string> {
  const stripped = stripFrontMatter(content);
  const md = getMarkdownRenderer();

  // imageBasePath reserved for future asset resolution
  void imageBasePath;

  let html = md.render(stripped);
  html = sanitize(html);

  // Async post-processing (KaTeX, Mermaid) if in browser
  if (typeof window !== 'undefined') {
    html = await renderKatex(html);
    html = await renderMermaid(html);
  }

  return html;
}

// ——— Slug / heading utilities ———

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function extractHeadings(content: string): Array<{ level: number; text: string; slug: string; line: number }> {
  const headings: Array<{ level: number; text: string; slug: string; line: number }> = [];
  const slugCounts: Record<string, number> = {};
  const lines = content.split('\n');
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const m = lines[lineNum].match(/^(#{1,6})\s+(.+)/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].trim();
    let slug = slugify(text);
    if (slugCounts[slug] !== undefined) {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 0;
    }
    headings.push({ level, text, slug, line: lineNum });
  }
  return headings;
}
