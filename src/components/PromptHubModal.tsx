import React, { useState } from 'react';
import { X, Search, Sparkles, Code, PenTool, Briefcase, GraduationCap, MessageSquareHeart } from 'lucide-react';

interface PromptHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}

interface PromptItem {
  id: string;
  category: string;
  title: string;
  prompt: string;
  badge: string;
}

const PROMPT_DATABASE: PromptItem[] = [
  // Coding
  {
    id: 'code-1',
    category: 'coding',
    title: 'Full-Stack React & Node App',
    prompt: 'Write a complete production-grade TypeScript React component with Tailwind CSS that handles file uploads with drag-and-drop, progress bar, and preview.',
    badge: 'Code',
  },
  {
    id: 'code-2',
    category: 'coding',
    title: 'Python Data Scraper & Analyzer',
    prompt: 'Write an asynchronous Python script using BeautifulSoup and asyncio that scrapes article titles, analyzes sentiment, and outputs a clean CSV.',
    badge: 'Python',
  },
  {
    id: 'code-3',
    category: 'coding',
    title: 'Find & Fix Complex Bug',
    prompt: 'Here is a bug in my code where state is causing an infinite re-render loop. Can you explain why it happens and provide the optimal fix?',
    badge: 'Debugging',
  },
  {
    id: 'code-4',
    category: 'coding',
    title: 'REST API with JWT Authentication',
    prompt: 'Show me how to build secure JWT authentication in Node.js/Express with refresh tokens, password hashing via bcrypt, and middleware.',
    badge: 'Backend',
  },

  // Creative & Urdu / Roman Urdu
  {
    id: 'urdu-1',
    category: 'urdu',
    title: 'Roman Urdu / Urdu Ghazal & Poetry',
    prompt: 'Mujhe aik khoobsurat Roman Urdu mein shayari ya ghazal likh kar do jo umeed, mehnat aur kamyabi ke baare mein ho.',
    badge: 'Roman Urdu',
  },
  {
    id: 'urdu-2',
    category: 'urdu',
    title: 'Viral YouTube / TikTok Video Script',
    prompt: 'Aik high-retention 60-second video script likhein (Roman Urdu + English) jiss ka hook zabardast ho, topic: "Top 5 AI tools in 2026".',
    badge: 'Content',
  },
  {
    id: 'urdu-3',
    category: 'urdu',
    title: 'Friendly Urdu Conversational Chat',
    prompt: 'Salam! Kya haal hai? Aaj se aap mere personal AI mentor ho, mujhe guide karo ke main freelancing aur coding kaise shuru karoon.',
    badge: 'Advisor',
  },

  // Writing
  {
    id: 'write-1',
    category: 'writing',
    title: 'High-Converting Cold Outreach Email',
    prompt: 'Write a compelling 3-sentence B2B cold email pitch for a software agency targeting SaaS founders, focusing on high conversion without being pushy.',
    badge: 'Outreach',
  },
  {
    id: 'write-2',
    category: 'writing',
    title: 'Professional Resume Summary & Bullets',
    prompt: 'Revamp my resume experience section using Google XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).',
    badge: 'Career',
  },

  // Business & Strategy
  {
    id: 'biz-1',
    category: 'business',
    title: 'Complete Startup Business Plan',
    prompt: 'Draft an executive summary and go-to-market strategy for an AI automation consulting agency with pricing tiers and target customer personas.',
    badge: 'Business',
  },
  {
    id: 'biz-2',
    category: 'business',
    title: 'Competitive Market Analysis',
    prompt: 'Provide a structured SWOT analysis and competitive matrix for entering the AI productivity tools space in 2026.',
    badge: 'Strategy',
  },

  // Learning & Math
  {
    id: 'edu-1',
    category: 'learning',
    title: 'Calculus & Derivatives Explained Simply',
    prompt: 'Explain the fundamental theorem of calculus and how derivatives are calculated with intuitive visual metaphors and 3 real-world examples.',
    badge: 'Math',
  },
  {
    id: 'edu-2',
    category: 'learning',
    title: 'Quantum Computing for Beginners',
    prompt: 'Explain quantum superposition and qubits to someone who understands classical computers but has zero physics background.',
    badge: 'Science',
  },
];

export const PromptHubModal: React.FC<PromptHubModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'coding' | 'urdu' | 'writing' | 'business' | 'learning'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Presets', icon: Sparkles },
    { id: 'coding', label: 'Coding & Tech', icon: Code },
    { id: 'urdu', label: 'Urdu & Roman Urdu', icon: MessageSquareHeart },
    { id: 'writing', label: 'Writing & Copy', icon: PenTool },
    { id: 'business', label: 'Business & Career', icon: Briefcase },
    { id: 'learning', label: 'Math & Learning', icon: GraduationCap },
  ];

  const filtered = PROMPT_DATABASE.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-[#0c101a] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Mian's AI Prompt Library</h3>
              <p className="text-xs text-slate-400">Discover instant superpowers for any task or idea</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/30 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search prompts by keyword, language, or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-900/90 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === cat.id
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid List */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectPrompt(item.prompt);
                onClose();
              }}
              className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/50 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400/80">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                <span>Click to use prompt</span>
                <span className="font-semibold">Use →</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm">
              No matching prompts found. Try a different search term!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
