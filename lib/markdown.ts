import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import GithubSlugger from "github-slugger";
import sanitizeHtml from "sanitize-html";

export type Heading = { id: string; text: string; level: number };

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function renderMarkdown(md: string, { sanitize = false } = {}) {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: "hljs",
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    }),
  );
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, "");
        const id = slugger.slug(plain);
        if (depth >= 2 && depth <= 4) headings.push({ id, text: plain, level: depth });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}">#</a>${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const ext = /^https?:\/\//.test(href);
        return `<a href="${escAttr(href)}"${title ? ` title="${escAttr(title)}"` : ""}${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
      },
      image({ href, title, text }) {
        return `<img src="${escAttr(href)}" alt="${escAttr(text)}"${title ? ` title="${escAttr(title)}"` : ""} loading="lazy" />`;
      },
    },
  });
  let html = marked.parse(md, { async: false }) as string;
  if (sanitize) {
    // 用户在网页端提交的内容需过滤，防止 XSS
    html = sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "del", "input"]),
      allowedAttributes: {
        "*": ["id", "class", "title"],
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "loading"],
        input: ["type", "checked", "disabled"],
        td: ["align"],
        th: ["align"],
      },
      allowedSchemes: ["http", "https", "mailto"],
    });
  }
  return { html, headings };
}

export function countWords(md: string) {
  const text = md.replace(/```[\s\S]*?```/g, "").replace(/[#>*_`\-\[\]()!]/g, "");
  const cjk = (text.match(/[一-龥]/g) || []).length;
  const en = (text.replace(/[一-龥]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
  return cjk + en;
}

export function plainText(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_`|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
