import React, { useState } from 'react';
import { X, Smartphone, Monitor, Download, ExternalLink, Code2, Play } from 'lucide-react';

interface WebsitePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  title?: string;
}

export const WebsitePreviewModal: React.FC<WebsitePreviewModalProps> = ({
  isOpen,
  onClose,
  code,
  title = 'Live Website Preview',
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  if (!isOpen) return null;

  // Format full HTML if it's a snippet
  const fullHtml = code.includes('<html')
    ? code
    : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6">
  ${code}
</body>
</html>`;

  const handleDownloadHtml = () => {
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mians_ai_website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-800 bg-[#0a0e1a] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-white font-display truncate max-w-xs md:max-w-md">
              {title}
            </span>
            <span className="text-[11px] text-cyan-400 font-mono hidden sm:inline">
              · Powered by Mian's AI
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="w-3 h-3" />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3 h-3" />
                Code
              </button>
            </div>

            {/* Device Switcher */}
            {activeTab === 'preview' && (
              <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setDevice('desktop')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    device === 'desktop'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    device === 'mobile'
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Download HTML */}
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
              title="Download index.html file"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Export HTML</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Canvas */}
        <div className="flex-1 bg-[#05070d] p-2 md:p-4 overflow-hidden flex items-center justify-center">
          {activeTab === 'preview' ? (
            <div
              className={`h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-white ${
                device === 'mobile' ? 'w-[375px] max-w-full' : 'w-full'
              }`}
            >
              <iframe
                title="Website Live Sandbox"
                srcDoc={fullHtml}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <pre className="w-full h-full p-4 overflow-auto rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-code leading-relaxed">
              <code>{fullHtml}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
