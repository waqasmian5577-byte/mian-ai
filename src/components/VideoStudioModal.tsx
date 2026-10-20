import React, { useState } from 'react';
import {
  X,
  Film,
  Sparkles,
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  Video,
  Clapperboard,
  Layers,
  Send,
  Sliders,
  Music
} from 'lucide-react';
import { AIVideoGenerator, VideoConfig, VideoRenderProgress } from '../utils/videoRenderer.ts';

interface VideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (prompt: string, videoUrl?: string) => void;
}

export const VideoStudioModal: React.FC<VideoStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('Epic cinematic drone journey through neon cyberpunk city with flying cars and holographic reflections');
  const [title, setTitle] = useState("Mian's Vision 2026");
  const [duration, setDuration] = useState<number>(30); // 10, 30, 50, 60
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [style, setStyle] = useState<VideoConfig['style']>('cyberpunk');
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<VideoRenderProgress | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickIdeas = [
    {
      label: 'Cyberpunk Skyline',
      prompt: 'Neon cyber highway with glowing reflections and holographic skyscrapers at midnight',
      style: 'cyberpunk' as const,
    },
    {
      label: 'Mountain Peaks (Mian Style)',
      prompt: 'Majestic mountain rocks, golden sunset clouds, and green valleys in dramatic cinematic 8K',
      style: 'nature' as const,
    },
    {
      label: 'Cosmic Space Odyssey',
      prompt: 'Deep interstellar nebula voyage through vibrant spiral galaxies and glowing star clusters',
      style: 'space' as const,
    },
    {
      label: 'Golden Hour Sunset',
      prompt: 'Warm golden ocean waves crashing onto peaceful shore with brilliant glowing sunset',
      style: 'sunset' as const,
    },
    {
      label: 'Luxury Gold Particles',
      prompt: 'Floating 3D gold dust and glowing diamonds moving smoothly in luxury dark atmosphere',
      style: 'luxury' as const,
    },
  ];

  const handleStartRender = async () => {
    if (!prompt.trim() || isRendering) return;

    setIsRendering(true);
    setRenderProgress({
      percent: 0,
      currentSecond: 0,
      totalSeconds: duration,
      status: 'Initializing AI cinematic video engine...',
    });

    try {
      const generator = new AIVideoGenerator();
      const result = await generator.generateVideo(
        {
          prompt,
          title: title || "Mian's AI Video",
          subtitle: prompt,
          durationSeconds: duration,
          aspectRatio,
          style,
        },
        (progress) => {
          setRenderProgress(progress);
        }
      );

      setGeneratedVideoUrl(result.videoUrl);
    } catch (err: any) {
      console.error('Video generation error:', err);
      alert('Video generation failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!generatedVideoUrl) return;
    const a = document.createElement('a');
    a.href = generatedVideoUrl;
    a.download = `mians_ai_video_${duration}s_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendToChatWithVideo = () => {
    if (!generatedVideoUrl) return;
    const msg = `🎬 [AI VIDEO PRODUCED: ${duration} SECONDS]
**Title:** ${title}
**Concept:** ${prompt}
**Duration:** ${duration}s (${aspectRatio})
**Visual Engine:** ${style.toUpperCase()}

*Video file is rendered and ready for playback!*`;
    onSendToChat(msg, generatedVideoUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-[#0c101a] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                Mian's AI Video Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                  10s · 30s · 50s · 1m
                </span>
              </h3>
              <p className="text-xs text-slate-400">Generate real playable and downloadable video files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Output Video Player Section if rendered */}
          {generatedVideoUrl ? (
            <div className="p-4 rounded-2xl border border-cyan-500/40 bg-slate-900/80 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white font-display">
                    Video Ready ({duration} Seconds · High Quality)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendToChatWithVideo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Insert in Chat
                  </button>
                  <button
                    onClick={handleDownloadVideo}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Video (.webm)
                  </button>
                </div>
              </div>

              {/* Video Player Component */}
              <div
                className={`relative mx-auto rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center shadow-lg ${
                  aspectRatio === '9:16'
                    ? 'w-[280px] h-[480px]'
                    : aspectRatio === '1:1'
                    ? 'w-[360px] h-[360px]'
                    : 'w-full max-h-[380px]'
                }`}
              >
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={() => setGeneratedVideoUrl(null)}
                  className="text-xs text-slate-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Create another video with different duration or style
                </button>
              </div>
            </div>
          ) : isRendering ? (
            /* Rendering Progress Bar */
            <div className="py-12 px-6 rounded-2xl border border-slate-800 bg-slate-900/60 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/25 animate-pulse">
                <Film className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white font-display">
                  Rendering {duration}-Second AI Video...
                </h4>
                <p className="text-xs text-slate-400">
                  {renderProgress?.status || 'Processing visual layers and audio synthesis...'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 via-indigo-500 to-cyan-400 h-2.5 rounded-full transition-all duration-150"
                    style={{ width: `${renderProgress?.percent || 5}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>{renderProgress?.currentSecond || 0}s / {duration}s</span>
                  <span>{renderProgress?.percent || 0}% Complete</span>
                </div>
              </div>
            </div>
          ) : (
            /* Video Creation Settings Form */
            <div className="space-y-5">
              {/* Concept Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Video Concept / Scene Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  placeholder="Describe your scene (e.g. Glowing hypercar racing through rain-soaked neon Tokyo at night)..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 transition-colors resize-none"
                />
              </div>

              {/* Quick Concept Templates */}
              <div>
                <span className="text-xs text-slate-400 mb-1.5 block font-medium">Quick Ideas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickIdeas.map((idea, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(idea.prompt);
                        setStyle(idea.style);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:text-rose-300 hover:border-rose-500/50 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 inline mr-1 text-rose-400" />
                      {idea.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Title Overlay */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Video Title / Text Overlay
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MIAN'S TECH REVOLUTION"
                  className="w-full px-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Grid: Duration, Ratio, Style */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* 1. Exact Duration requested by user (10s, 30s, 50s, 60s) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Duration (Exact)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { sec: 10, label: '10 Sec' },
                      { sec: 30, label: '30 Sec' },
                      { sec: 50, label: '50 Sec' },
                      { sec: 60, label: '1 Min (60s)' },
                    ].map((d) => (
                      <button
                        key={d.sec}
                        onClick={() => setDuration(d.sec)}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          duration === d.sec
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/40'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Aspect Ratio */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Aspect Ratio
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: '16:9', label: '16:9 Landscape (YouTube/TV)' },
                      { id: '9:16', label: '9:16 Portrait (TikTok/Reel)' },
                      { id: '1:1', label: '1:1 Square (Instagram/Feed)' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setAspectRatio(r.id as any)}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                          aspectRatio === r.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/40'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Visual Engine / Style */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Visual Aesthetic
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'cyberpunk', label: 'Cyberpunk Neon Matrix' },
                      { id: 'nature', label: 'Mian Mountains & Nature' },
                      { id: 'sunset', label: 'Golden Sunset Cinema' },
                      { id: 'space', label: 'Cosmic Starfield Galaxy' },
                      { id: 'luxury', label: 'Luxury Gold Particles' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id as any)}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                          style === s.id
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/40'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Generation Button */}
              <div className="flex justify-end pt-3">
                <button
                  onClick={handleStartRender}
                  disabled={!prompt.trim() || isRendering}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Generate {duration}s Video Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
