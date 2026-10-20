import React, { useState } from 'react';
import { marked } from 'marked';
import { Copy, Check, Code2, Play } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
  onPreviewWebsite?: (code: string) => void;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, onPreviewWebsite }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderWithInteractiveCode = (markdownText: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let codeIndex = 0;

    while ((match = codeBlockRegex.exec(markdownText)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        const textChunk = markdownText.substring(lastIndex, matchIndex);
        const html = marked.parse(textChunk) as string;
        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:text-slate-100 prose-a:text-cyan-400 hover:prose-a:underline prose-strong:text-white prose-ul:my-2 prose-li:my-0.5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      const lang = (match[1] || 'code').toLowerCase();
      const code = match[2];
      const currentCodeIdx = codeIndex++;
      const isHtml = lang === 'html' || code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<div') || code.includes('<body');

      parts.push(
        <div
          key={`code-${matchIndex}`}
          className="my-4 rounded-xl border border-slate-800 bg-[#0c101a] overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              {lang.toUpperCase()}
            </span>

            <div className="flex items-center gap-2">
              {/* If HTML code, show live preview button */}
              {isHtml && onPreviewWebsite && (
                <button
                  onClick={() => onPreviewWebsite(code)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/90 hover:bg-cyan-500 text-white font-medium transition-colors cursor-pointer text-[11px] shadow-sm"
                  title="Run and preview website live"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Preview Website</span>
                </button>
              )}

              <button
                onClick={() => copyToClipboard(code, currentCodeIdx)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedIndex === currentCodeIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-code text-emerald-300/90 leading-relaxed bg-[#080c14]">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < markdownText.length) {
      const remainingChunk = markdownText.substring(lastIndex);
      const html = marked.parse(remainingChunk) as string;
      parts.push(
        <div
          key={`text-${lastIndex}`}
          className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:text-slate-100 prose-a:text-cyan-400 hover:prose-a:underline prose-strong:text-white prose-ul:my-2 prose-li:my-0.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    return parts;
  };

  return <div className="space-y-3">{renderWithInteractiveCode(content)}</div>;
};
