import { Fragment, type ReactNode } from 'react';

/** **bold** → <strong>, everything else as plain text (no HTML is ever injected). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/**
 * Markdown-lite for assistant text (PRD §4.1): paragraphs (blank line), "- " bullet lists and
 * **bold**. Works while streaming — partial text renders as it arrives.
 */
export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((l) => l.trimStart().startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trimStart().slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{lines.map((l, j) => (j === 0 ? <Fragment key={j}>{inline(l)}</Fragment> : <Fragment key={j}><br />{inline(l)}</Fragment>))}</p>;
      })}
    </>
  );
}
