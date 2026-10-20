import React, { useState } from 'react';
import { X, CheckCircle2, Key, ShieldCheck, Zap, Sparkles, Heart } from 'lucide-react';

interface CreatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  isOpen,
  onClose,
  customApiKey,
  onSaveApiKey,
}) => {
  const [keyInput, setKeyInput] = useState(customApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetToDefault = () => {
    setKeyInput('');
    onSaveApiKey('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c101a] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Cover Banner */}
        <div className="relative h-32 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 flex items-end px-6 pb-3">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-mono tracking-widest text-white/80 uppercase font-semibold">
            Founder & Architect Verified
          </span>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 space-y-5 overflow-y-auto">
          {/* Avatar & Title Row */}
          <div className="flex items-end justify-between -mt-14 mb-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl p-1 bg-gradient-to-tr from-cyan-400 to-fuchsia-500 shadow-xl overflow-hidden">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-08-29_at_12.21.20_AM_c1d7f9f6.jpeg"
                  alt="Mian - Founder & Creator"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-white p-1 rounded-full shadow-md">
                <CheckCircle2 className="w-4 h-4 fill-current text-white" />
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
                <Zap className="w-3 h-3 text-cyan-400" />
                Lightning Speed Active
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-white font-display flex items-center gap-2">
              Mian
              <span className="text-xs font-normal text-slate-400 font-sans">
                (Sole Creator & Engineer)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Founder of <strong>Mian's AI</strong>. Built to empower everyone with instant answers, full website creation, AI video direction, Roman Urdu poetry, and unlimited assistance in split-seconds.
            </p>
          </div>

          {/* Highlights / Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">System Status</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Ultra Fast & Stable
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Model Engine</span>
              <span className="text-cyan-300 font-semibold flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini 3.1 Flash Lite
              </span>
            </div>
          </div>

          {/* Custom API Key Section (Unlimited Year Guarantee) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Custom API Key (Optional)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {customApiKey ? 'Using Personal Key' : 'Using Pre-Configured Key'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Mian's AI comes pre-activated for free usage. You can also paste your own Google AI Studio key below for private, unrestricted usage for years:
            </p>

            <div className="space-y-2">
              <input
                type="password"
                placeholder="AIzaSy... (Leave empty to use built-in engine key)"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <div className="flex items-center justify-between gap-2">
                {customApiKey && (
                  <button
                    onClick={handleResetToDefault}
                    className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
                  >
                    Reset to Default Key
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="ml-auto px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save Key
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div className="text-xs text-emerald-400 font-medium">
                ✓ Key settings updated and saved to your device!
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-500 pt-1 flex items-center justify-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-current inline" />
            <span>by Mian for the world.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
