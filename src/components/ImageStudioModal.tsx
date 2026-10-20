import React, { useState } from 'react';
import { Sparkles, Download, Copy, Check, X, RefreshCw, Wand2, Image as ImageIcon } from 'lucide-react';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (imageUrl: string, prompt: string) => void;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const styleSuggestions = [
    'Cinematic 8k hyperrealistic photography, dramatic lighting, Leica lens',
    'Futuristic cyberpunk city skyline at night with neon holographic reflections',
    'Anime masterpiece, Studio Ghibli style, vibrant colors and lush landscape',
    'Minimalist 3D isometric digital art, soft pastel shadows, clean clay render',
    'Vintage oil painting portrait with rich texture and warm chiaroscuro',
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = (customPrompt || prompt).trim();
    if (!textToUse) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong generating the image.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `mians-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0c101a] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Mian's AI Studio Generator</h3>
              <p className="text-xs text-slate-400">Generate high-fidelity artwork & designs directly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Image Description / Prompt
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe what you want to create (e.g., A majestic white tiger with glowing neon blue runes in an ancient misty forest)..."
                className="w-full px-4 py-3 text-sm rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
              />
              {prompt && (
                <button
                  onClick={handleCopyPrompt}
                  className="absolute right-3 top-3 p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Prompt"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Quick Style presets */}
          <div>
            <div className="text-xs text-slate-400 mb-2 font-medium">Quick Style Ideas (Click to populate):</div>
            <div className="flex flex-wrap gap-1.5">
              {styleSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(s)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-all text-left truncate max-w-xs cursor-pointer"
                >
                  <Wand2 className="w-3 h-3 inline mr-1 text-cyan-400" />
                  {s.slice(0, 42)}...
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Aspect Ratio
            </label>
            <div className="flex items-center gap-2">
              {[
                { id: '1:1', label: '1:1 Square' },
                { id: '16:9', label: '16:9 Landscape' },
                { id: '9:16', label: '9:16 Reel / Story' },
                { id: '4:3', label: '4:3 Classic' },
              ].map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    aspectRatio === ratio.id
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/40'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-950/60 border border-red-800/60 text-red-300">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Masterpiece...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {/* Output Preview */}
          {generatedImage && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  Result
                </span>
                <div className="flex items-center gap-2">
                  {onSendToChat && (
                    <button
                      onClick={() => {
                        onSendToChat(generatedImage, prompt);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Insert in Chat
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white shadow transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG
                  </button>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center max-h-[380px]">
                <img
                  src={generatedImage}
                  alt={prompt}
                  referrerPolicy="no-referrer"
                  className="max-h-[380px] w-auto object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
