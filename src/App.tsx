import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Download,
  Menu,
  X,
  Code2,
  PenTool,
  GraduationCap,
  MessageSquareHeart,
  ExternalLink,
  Bot,
  User,
  Sliders,
  Share2,
  Smartphone,
  Play,
  Film,
  Zap,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { ChatMessage, ChatSession, PersonaType, AttachedImage } from './types.ts';
import { MarkdownView } from './components/MarkdownView.tsx';
import { ImageStudioModal } from './components/ImageStudioModal.tsx';
import { PromptHubModal } from './components/PromptHubModal.tsx';
import { WebsitePreviewModal } from './components/WebsitePreviewModal.tsx';
import { VideoStudioModal } from './components/VideoStudioModal.tsx';
import { CreatorProfileModal } from './components/CreatorProfileModal.tsx';
import { usePWAInstall } from './hooks/usePWAInstall.ts';
import { speakText, stopSpeaking } from './utils/speech.ts';

const MIAN_PHOTO_URL = '/assets/aistudio/WhatsApp_Image_2026-08-29_at_12.21.20_AM_c1d7f9f6.jpeg';

const PERSONAS: Record<
  PersonaType,
  { name: string; icon: any; color: string; desc: string }
> = {
  general: {
    name: 'Omniverse AI',
    icon: Sparkles,
    color: 'from-cyan-400 to-indigo-500',
    desc: 'Versatile companion for any request, reasoning, and tasks',
  },
  coder: {
    name: 'Code & Web Architect',
    icon: Code2,
    color: 'from-emerald-400 to-cyan-500',
    desc: 'Builds full websites, apps, debugging, and scripts in seconds',
  },
  urdu_friendly: {
    name: 'Urdu & Roman Companion',
    icon: MessageSquareHeart,
    color: 'from-rose-400 to-purple-500',
    desc: 'Warm bilingual Urdu and Roman Urdu conversational expert',
  },
  writer: {
    name: 'Creative Wordsmith',
    icon: PenTool,
    color: 'from-amber-400 to-orange-500',
    desc: 'High-impact copywriting, viral scripts, poetry, and storytelling',
  },
  tutor: {
    name: 'Logic & Scholar',
    icon: GraduationCap,
    color: 'from-blue-400 to-violet-500',
    desc: 'Step-by-step math solver, science concepts, and academic tutor',
  },
};

export default function App() {
  // PWA Install hook
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  // Custom API key stored in localStorage (optional for unlimited personal usage)
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('mians_custom_api_key') || '';
  });

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem('mians_custom_api_key', key);
    } else {
      localStorage.removeItem('mians_custom_api_key');
    }
  };

  // Chat sessions state with local storage persistence
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('mians_ai_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed loading sessions from localStorage', e);
    }
    const initialId = 'session-' + Date.now();
    return [
      {
        id: initialId,
        title: 'New Conversation',
        persona: 'general',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        enableSearch: false, // Default false for lightning-fast sub-second responses!
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session-default';
  });

  // UI state
  const [inputMessage, setInputMessage] = useState('');
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [previewWebsiteCode, setPreviewWebsiteCode] = useState<string | null>(null);

  const [activePersona, setActivePersona] = useState<PersonaType>('general');
  const [enableSearch, setEnableSearch] = useState(false);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    try {
      localStorage.setItem('mians_ai_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  }, [sessions]);

  useEffect(() => {
    if (currentSession) {
      setActivePersona(currentSession.persona || 'general');
      setEnableSearch(currentSession.enableSearch ?? false);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [inputMessage]);

  // Web Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSInstallGuide(true);
    } else {
      // Show informative helper
      alert('To install Mian\'s AI on your device, tap your browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App".');
    }
  };

  const handleNewChat = (persona: PersonaType = 'general') => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'New Conversation',
      persona,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      enableSearch: false,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActivePersona(persona);
    setInputMessage('');
    setAttachedImages([]);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fresh: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'New Conversation',
        persona: 'general',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        enableSearch: false,
      };
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAttachedImages((prev) => [
              ...prev,
              {
                mimeType: file.type,
                data: event.target!.result as string,
                name: file.name,
                size: file.size,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setInputMessage((prev) => `${prev}\n\n[Attached: ${file.name}]\n\`\`\`\n${content}\n\`\`\``);
        };
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedImage = (idx: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Ultra-Fast Message Sender
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || inputMessage).trim();
    if ((!textToSend && attachedImages.length === 0) || isGenerating) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const currentImages = [...attachedImages];
    const userMsgId = 'msg-' + Date.now();
    const assistantMsgId = 'msg-ai-' + (Date.now() + 1);

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
      images: currentImages.length > 0 ? currentImages : undefined,
    };

    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      text: '',
      timestamp: Date.now() + 1,
      isStreaming: true,
    };

    const updatedTitle =
      currentSession.messages.length === 0
        ? textToSend.slice(0, 32) || 'New Task'
        : currentSession.title;

    const nextMessages = [...currentSession.messages, newUserMsg, initialAssistantMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: updatedTitle,
              messages: nextMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setInputMessage('');
    setAttachedImages([]);
    setIsGenerating(true);

    try {
      const historyPayload = nextMessages
        .slice(0, -1)
        .map((m) => ({
          role: m.role,
          text: m.text,
          images: m.images,
        }));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customApiKey) {
        headers['x-gemini-key'] = customApiKey;
      }

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: historyPayload,
          persona: activePersona,
          enableSearch,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to connect to Mian\'s AI server');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let groundingInfo: any = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.replace('data: ', ''));

                if (data.error) {
                  accumulatedText = `⚠️ ${data.error}`;
                  break;
                }

                if (data.text) {
                  accumulatedText += data.text;
                }

                if (data.done) {
                  groundingInfo = data.groundingMetadata;
                }

                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id !== currentSession.id) return s;
                    return {
                      ...s,
                      messages: s.messages.map((msg) =>
                        msg.id === assistantMsgId
                          ? {
                              ...msg,
                              text: accumulatedText,
                              isStreaming: !data.done,
                              groundingMetadata: groundingInfo,
                            }
                          : msg
                      ),
                    };
                  })
                );
              } catch (parseErr) {
                // Ignore incomplete SSE json
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== currentSession.id) return s;
          return {
            ...s,
            messages: s.messages.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    text:
                      '⚠️ Network interrupted. Please tap Retry to generate immediately.',
                    isStreaming: false,
                  }
                : msg
            ),
          };
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickStarter = (promptText: string) => {
    setInputMessage(promptText);
    textareaRef.current?.focus();
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (speakingMessageId === id) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(id);
      speakText(
        text,
        () => setSpeakingMessageId(id),
        () => setSpeakingMessageId(null),
        () => setSpeakingMessageId(null)
      );
    }
  };

  const handleInsertGeneratedImage = (imageUrl: string, promptText: string) => {
    const userMsgId = 'msg-' + Date.now();
    const assistantMsgId = 'msg-ai-' + (Date.now() + 1);

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: `Generate an image: "${promptText}"`,
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      text: `Here is your visual art created for: **"${promptText}"**`,
      timestamp: Date.now() + 1,
      isImageGenerated: true,
      generatedImageUrl: imageUrl,
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              messages: [...s.messages, userMsg, assistantMsg],
              updatedAt: Date.now(),
            }
          : s
      )
    );
  };

  const handleInsertGeneratedVideo = (promptText: string, videoUrl?: string) => {
    if (videoUrl) {
      const userMsgId = 'msg-' + Date.now();
      const assistantMsgId = 'msg-ai-' + (Date.now() + 1);

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        text: promptText,
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'model',
        text: `🎬 **Video Production Complete!**\nYour high-definition AI video has been rendered and is ready for playback and export below.`,
        timestamp: Date.now() + 1,
        generatedVideoUrl: videoUrl,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                messages: [...s.messages, userMsg, assistantMsg],
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } else {
      handleSendMessage(promptText);
    }
  };

  const handleExportChat = () => {
    const formatted = currentSession.messages
      .map((m) => {
        const sender = m.role === 'user' ? '### User' : "### Mian's AI";
        return `${sender} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.text}\n\n---`;
      })
      .join('\n\n');

    const blob = new Blob([formatted], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#04060b] text-slate-100">
      {/* Background glow mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[45vw] h-[45vw] rounded-full bg-cyan-600/10 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-[35%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/10 blur-[140px] animate-pulse-slow" />
        <div className="absolute -bottom-[20%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-fuchsia-600/10 blur-[140px] animate-pulse-slow" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 md:w-64 lg:w-72 flex flex-col bg-[#080b13]/95 border-r border-slate-800/80 backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Creator Identity Profile Card in Sidebar */}
        <div
          onClick={() => setIsCreatorModalOpen(true)}
          className="p-3.5 border-b border-slate-800/80 bg-gradient-to-b from-cyan-950/20 to-transparent cursor-pointer group hover:bg-slate-900/50 transition-colors"
          title="View Founder & Architect Profile"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl p-0.5 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-lg shadow-cyan-500/20 overflow-hidden">
                <img
                  src={MIAN_PHOTO_URL}
                  alt="Mian"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-white p-0.5 rounded-full shadow">
                <CheckCircle2 className="w-3 h-3 fill-current text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white tracking-tight font-display truncate group-hover:text-cyan-300 transition-colors">
                  Mian's AI
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  CREATOR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Engineered by Mian
              </p>
            </div>
          </div>
        </div>

        {/* Action: New Chat & Install on Mobile */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => handleNewChat(activePersona)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>

          {/* Direct Install PWA button inside sidebar */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Install directly to your mobile home screen or computer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install App on Mobile</span>
            </button>
          )}
        </div>

        {/* Persona Selector */}
        <div className="px-3 py-2 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Specialist Mode</span>
            <Sliders className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="space-y-1">
            {(Object.keys(PERSONAS) as PersonaType[]).map((key) => {
              const p = PERSONAS[key];
              const Icon = p.icon;
              const isSelected = activePersona === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActivePersona(key);
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === currentSession.id ? { ...s, persona: key } : s
                      )
                    );
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
            Recent Chats
          </div>
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-800/80 text-white font-medium border border-slate-700/60 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <span className="truncate pr-2">{s.title || 'Conversation'}</span>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Tools & Settings in Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/70 space-y-1.5 bg-slate-950/40">
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 text-rose-400" />
            <span>AI Video Production</span>
          </button>
          <button
            onClick={() => setIsImageModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Image Studio</span>
          </button>
          <button
            onClick={() => setIsPromptModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Prompt Super Library</span>
          </button>
          <button
            onClick={() => setIsCreatorModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Engine & Key Settings</span>
          </button>
          <button
            onClick={handleExportChat}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Chat (.md)</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="relative flex flex-1 flex-col h-full overflow-hidden z-10">
        {/* Top Navigation Bar: Strict 3-Zone Contract with Install Button & Creator Badge */}
        <header className="flex items-center justify-between gap-6 px-4 md:px-8 py-3.5 border-b border-slate-800/80 bg-[#070a12]/80 backdrop-blur-md shrink-0">
          {/* Zone 1: Brand Wordmark with Creator Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden cursor-pointer"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Clickable Creator Photo Avatar in Header */}
            <div
              onClick={() => setIsCreatorModalOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Created by Mian — Tap to view profile"
            >
              <div className="relative w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 overflow-hidden shadow">
                <img
                  src={MIAN_PHOTO_URL}
                  alt="Mian - Founder"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white font-display whitespace-nowrap shrink-0 group-hover:text-cyan-300 transition-colors">
                  Mian's AI
                </span>
                <span className="hidden sm:inline-block ml-1.5 text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  By Mian
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links (1-line, whitespace-nowrap) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="hover:text-rose-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span>Video Studio</span>
            </button>
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Image Creator</span>
            </button>
            <button
              onClick={() => setIsPromptModalOpen(true)}
              className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Prompts
            </button>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Ultra-Fast Mode
            </span>
          </nav>

          {/* Zone 3: 1 Primary Action + Direct Install App Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Install App Button */}
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition-all cursor-pointer whitespace-nowrap shrink-0 animate-bounce-subtle"
                title="Install app directly to your mobile home screen"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            <button
              onClick={() => handleNewChat(activePersona)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-md shadow-cyan-500/20 whitespace-nowrap shrink-0 cursor-pointer"
            >
              + New Chat
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {/* Welcome Screen featuring Mian's Photo & Omniverse Superpowers */}
          {currentSession.messages.length === 0 && (
            <div className="max-w-3xl mx-auto py-6 md:py-12 text-center space-y-7 animate-float-gentle">
              {/* Creator Photo Showcase */}
              <div
                onClick={() => setIsCreatorModalOpen(true)}
                className="inline-block cursor-pointer group"
                title="Engineered by Mian"
              >
                <div className="relative mx-auto w-20 h-20 md:w-24 md:h-24 rounded-2xl p-1 bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-2xl shadow-cyan-500/30 overflow-hidden transform group-hover:scale-105 transition-transform">
                  <img
                    src={MIAN_PHOTO_URL}
                    alt="Mian"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1 text-[10px] font-semibold text-white">
                    Creator Profile
                  </div>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                  Engineered by Mian
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-display">
                  Mian's AI
                </h1>
                <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Aap ka super-fast all-in-one AI companion. Website banana ho, AI video script likhni ho, image banani ho ya Roman Urdu mein baat karni ho — sab kuch seconds mein!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-cyan-400 font-mono pt-1">
                  <span>⚡ Instant Sub-Second Speed</span>
                  <span aria-hidden="true">·</span>
                  <span>🌐 Website Builder & Sandbox</span>
                  <span aria-hidden="true">·</span>
                  <span>🎬 Video Studio</span>
                  <span aria-hidden="true">·</span>
                  <span>📲 Install on Mobile</span>
                </div>
              </div>

              {/* 4 Superpower Action Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2">
                {/* 1. Website Builder */}
                <div
                  onClick={() =>
                    handleSendMessage(
                      'Build a complete modern, responsive Landing Page website in a single HTML file with Tailwind CSS and interactive JavaScript. Include a hero section, feature cards, and contact form.'
                    )
                  }
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-cyan-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        🌐 Build a Complete Website
                      </span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">Live Sandbox</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Write full HTML/CSS/JS websites with instant live preview and 1-click download.
                  </p>
                </div>

                {/* 2. Video Studio */}
                <div
                  onClick={() => setIsVideoModalOpen(true)}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-rose-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-semibold text-white group-hover:text-rose-300 transition-colors">
                        🎬 AI Video & Script Studio
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-400 font-mono">Veo / Sora</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Generate scene-by-scene video storyboards, viral hooks, and AI prompts.
                  </p>
                </div>

                {/* 3. Urdu & Roman Master */}
                <div
                  onClick={() =>
                    handleSendMessage(
                      'Assalam-o-Alaikum Mian! Mujhe aik bohat zabardast Roman Urdu mein motivational shayari aur dilchasp speech likh kar do.'
                    )
                  }
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-purple-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <MessageSquareHeart className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                        🇵🇰 Roman Urdu Shayari & Story
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono">Native Tone</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dilkash Roman Urdu poetry, speeches, advice, aur har sawal ka mukammal jawab.
                  </p>
                </div>

                {/* 4. Image Studio */}
                <div
                  onClick={() => setIsImageModalOpen(true)}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        🖼️ AI Image Studio
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono">High-Res</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Craft photorealistic portraits, 3D renders, and wallpapers in seconds.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="max-w-3xl mx-auto space-y-6">
            {currentSession.messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 md:gap-4 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Assistant Avatar with Mian's branding */}
                  {!isUser && (
                    <div
                      onClick={() => setIsCreatorModalOpen(true)}
                      className="w-8 h-8 rounded-xl p-0.5 bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20 mt-1 cursor-pointer overflow-hidden"
                      title="Mian's AI"
                    >
                      <img
                        src={MIAN_PHOTO_URL}
                        alt="Mian"
                        className="w-full h-full object-cover rounded-[10px]"
                      />
                    </div>
                  )}

                  <div
                    className={`flex flex-col max-w-[88%] md:max-w-[82%] ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Attached images */}
                    {message.images && message.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {message.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 max-w-[240px] max-h-[180px]"
                          >
                            <img
                              src={img.data}
                              alt={img.name || 'Visual'}
                              referrerPolicy="no-referrer"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-md ${
                        isUser
                          ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                          : 'bg-[#0f1422]/90 border border-slate-800 text-slate-200 rounded-tl-none w-full backdrop-blur-md'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      ) : (
                        <div>
                          {message.generatedVideoUrl ? (
                            <div className="space-y-3 my-2">
                              <p className="font-medium text-slate-200">{message.text}</p>
                              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center max-h-[380px] shadow-xl">
                                <video
                                  src={message.generatedVideoUrl}
                                  controls
                                  playsInline
                                  autoPlay
                                  loop
                                  className="max-h-[380px] w-full object-contain"
                                />
                              </div>
                              <a
                                href={message.generatedVideoUrl}
                                download={`mians-ai-video-${Date.now()}.webm`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow transition-all cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download Video File (.webm)
                              </a>
                            </div>
                          ) : message.isImageGenerated && message.generatedImageUrl ? (
                            <div className="space-y-3 my-2">
                              <p className="font-medium text-slate-200">{message.text}</p>
                              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center max-h-[380px]">
                                <img
                                  src={message.generatedImageUrl}
                                  alt="Generated"
                                  referrerPolicy="no-referrer"
                                  className="max-h-[380px] w-auto object-contain"
                                />
                              </div>
                              <a
                                href={message.generatedImageUrl}
                                download={`mians-ai-art-${Date.now()}.png`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download Artwork
                              </a>
                            </div>
                          ) : (
                            <MarkdownView
                              content={message.text}
                              onPreviewWebsite={(code) => setPreviewWebsiteCode(code)}
                            />
                          )}

                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                          )}

                          {/* Grounding sources */}
                          {message.groundingMetadata?.groundingChunks && (
                            <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
                              <div className="flex items-center gap-1 text-slate-400 mb-1.5 font-medium">
                                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Verified Web Sources:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {message.groundingMetadata.groundingChunks.map(
                                  (chunk, cIdx) => {
                                    if (!chunk.web?.uri) return null;
                                    return (
                                      <a
                                        key={cIdx}
                                        href={chunk.web.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] transition-colors"
                                      >
                                        <span className="truncate max-w-[180px]">
                                          {chunk.web.title || chunk.web.uri}
                                        </span>
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                      </a>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Toolbar */}
                    {!isUser && !message.isStreaming && (
                      <div className="flex items-center gap-2 mt-1.5 px-1 text-slate-400">
                        <button
                          onClick={() => handleToggleSpeak(message.id, message.text)}
                          className={`flex items-center gap-1 text-xs hover:text-cyan-400 transition-colors p-1 cursor-pointer ${
                            speakingMessageId === message.id ? 'text-cyan-400 font-semibold' : ''
                          }`}
                          title="Speak answer aloud"
                        >
                          {speakingMessageId === message.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Listen</span>
                            </>
                          )}
                        </button>

                        <span className="text-slate-700">·</span>

                        <button
                          onClick={() => handleCopyMessage(message.id, message.text)}
                          className="flex items-center gap-1 text-xs hover:text-cyan-400 transition-colors p-1 cursor-pointer"
                          title="Copy response"
                        >
                          {copiedMessageId === message.id ? (
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

                        <span className="text-slate-700">·</span>

                        <button
                          onClick={() => {
                            const msgIndex = currentSession.messages.findIndex(
                              (m) => m.id === message.id
                            );
                            if (msgIndex > 0) {
                              const prevUserMsg = currentSession.messages[msgIndex - 1];
                              if (prevUserMsg.role === 'user') {
                                handleSendMessage(prevUserMsg.text);
                              }
                            }
                          }}
                          className="flex items-center gap-1 text-xs hover:text-cyan-400 transition-colors p-1 cursor-pointer"
                          title="Regenerate answer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Retry</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar Workspace */}
        <div className="p-4 md:px-8 border-t border-slate-800/80 bg-[#070a12]/90 backdrop-blur-xl shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {attachedImages.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {attachedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 w-16 h-16 shrink-0"
                  >
                    <img
                      src={img.data}
                      alt="Thumbnail"
                      referrerPolicy="no-referrer"
                      className="object-cover w-full h-full"
                    />
                    <button
                      onClick={() => removeAttachedImage(idx)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <span className="text-xs text-slate-400">
                  {attachedImages.length} image{attachedImages.length > 1 ? 's' : ''} attached for vision analysis
                </span>
              </div>
            )}

            <div className="relative flex flex-col rounded-2xl border border-slate-800 bg-[#0d121f] focus-within:border-cyan-500/60 shadow-xl transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  isListening
                    ? 'Listening... Speak in Urdu, English, or any language...'
                    : `Ask Mian's AI to build a website, video script, code, or Urdu shayari...`
                }
                className="w-full px-4 pt-3.5 pb-2 text-sm bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,.txt,.json,.js,.ts,.py,.html"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Upload image for vision or code/text file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Video Studio & Storyboard Creator"
                  >
                    <Film className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsImageModalOpen(true)}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Generate AI Images"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleListening}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice Input (Speak in Urdu or English)'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setIsPromptModalOpen(true)}
                    className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors cursor-pointer hidden sm:flex"
                    title="Open Prompt Library"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={
                    (!inputMessage.trim() && attachedImages.length === 0) || isGenerating
                  }
                  className="flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25 transition-all cursor-pointer"
                  title="Send (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Engineered by Mian · Sub-Second Response Active</span>
              <span className="font-mono">Shift + Enter for newline</span>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ImageStudioModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSendToChat={handleInsertGeneratedImage}
      />

      <VideoStudioModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSendToChat={(prompt, videoUrl) => handleInsertGeneratedVideo(prompt, videoUrl)}
      />

      <PromptHubModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSelectPrompt={(selectedText) => {
          setInputMessage(selectedText);
          textareaRef.current?.focus();
        }}
      />

      {previewWebsiteCode && (
        <WebsitePreviewModal
          isOpen={Boolean(previewWebsiteCode)}
          onClose={() => setPreviewWebsiteCode(null)}
          code={previewWebsiteCode}
        />
      )}

      <CreatorProfileModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
        customApiKey={customApiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* iOS Safari Install Guide Modal */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0c101a] p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-display">Install Mian's AI on iPhone</h3>
            <p className="text-xs text-slate-300 leading-relaxed text-left space-y-1.5">
              1. Tap the <strong>Share</strong> button (box with arrow) at the bottom of Safari.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> in the top-right corner.
            </p>
            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
