import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Sun,
  Moon,
  Info,
  X,
  Send,
  Square,
  Copy,
  Check,
  Trash2,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { SANCTUARY_BOTS } from '../../data/botRoster';
import { SanctuaryBotAvatar } from '../../components/common/SanctuaryBotAvatar';
import { IOSSpinner } from '../../components/common/IOSActivityIndicator';
import {
  BOT_CATEGORIES,
  getBotCategory,
  getBotHomeSection,
  streamBotReply,
  clearBotConversationCache,
  parseRichInlineSegments,
  navigateSpaRoute,
  type BotCategoryId,
  type BotResponseSource,
  type BotSuggestedLink,
} from '../../services/botGroqEngine';
import './agent-hub.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  steps?: string[];
  source?: BotResponseSource;
  model?: string;
  suggestedLinks?: BotSuggestedLink[];
}

export interface AgentHubProps {
  initialAgentId?: string;
  initialPrompt?: string;
  onClose?: () => void;
  isModal?: boolean;
}

const RichBotMessageBody: React.FC<{
  text: string;
  onCloseModal?: () => void;
}> = ({ text, onCloseModal }) => {
  const lines = text.split('\n');
  return (
    <div className="ag-rich-text">
      {lines.map((rawLine, lineIdx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="ag-rich-gap" aria-hidden="true" />;
        }
        const isBullet = /^([•\-*]|\d+[.)])\s+/.test(trimmed);
        const contentLine = isBullet ? trimmed.replace(/^([•\-*]|\d+[.)])\s+/, '') : trimmed;
        const segments = parseRichInlineSegments(contentLine);

        return (
          <div key={lineIdx} className={isBullet ? 'ag-rich-li' : 'ag-rich-p'}>
            {isBullet && <span className="ag-rich-dot" aria-hidden="true">•</span>}
            <span>
              {segments.map((seg, segIdx) => {
                if (seg.type === 'bold') {
                  return <strong key={segIdx}>{seg.value}</strong>;
                }
                if (seg.type === 'italic') {
                  return <em key={segIdx}>{seg.value}</em>;
                }
                if (seg.type === 'link') {
                  return (
                    <a
                      key={segIdx}
                      href={seg.href}
                      className="ag-inline-route"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateSpaRoute(seg.href, onCloseModal);
                      }}
                    >
                      {seg.value}
                      <ArrowUpRight className="inline w-3 h-3 ml-0.5 align-baseline" />
                    </a>
                  );
                }
                return <React.Fragment key={segIdx}>{seg.value}</React.Fragment>;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const SOURCE_LABEL_MAP: Record<BotResponseSource, string> = {
  groq: 'Verified',
  'edge-groq': 'Verified',
  cache: 'Cached · Instant',
  local: 'Offline Grounded',
};

export const AgentHub: React.FC<AgentHubProps> = ({
  initialAgentId = SANCTUARY_BOTS[0].id,
  initialPrompt,
  onClose,
  isModal = false,
}) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    const found = SANCTUARY_BOTS.find((a) => a.id === initialAgentId);
    return found ? found.id : SANCTUARY_BOTS[0].id;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<BotCategoryId>('all');
  const [showInspector, setShowInspector] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [streamingIds, setStreamingIds] = useState<Record<string, boolean>>({});
  const [typingStepsMap, setTypingStepsMap] = useState<Record<string, string[]>>({});
  const [streamingTextMap, setStreamingTextMap] = useState<Record<string, string>>({});
  const [inputQuery, setInputQuery] = useState('');

  const [histories, setHistories] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    SANCTUARY_BOTS.forEach((agent) => {
      initial[agent.id] = [
        {
          id: `welcome-${agent.id}`,
          sender: 'agent',
          text: agent.greeting,
          timestamp: 'Ready',
        },
      ];
    });
    return initial;
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const handledPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialAgentId && SANCTUARY_BOTS.some((a) => a.id === initialAgentId)) {
      setSelectedId(initialAgentId);
    }
  }, [initialAgentId]);

  const activeAgent = SANCTUARY_BOTS.find((a) => a.id === selectedId) || SANCTUARY_BOTS[0];
  const currentHistory = histories[selectedId] || [];
  const isCurrentStreaming = Boolean(streamingIds[selectedId]);
  const currentStreamingText = streamingTextMap[selectedId] || '';
  const currentTypingSteps = typingStepsMap[selectedId] || [];
  const activeSectionHome = getBotHomeSection(activeAgent.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [selectedId, currentHistory.length, isCurrentStreaming, currentStreamingText]);

  useEffect(() => {
    const map = abortControllersRef.current;
    return () => {
      map.forEach((ctrl) => ctrl.abort());
      map.clear();
    };
  }, []);

  const handleStopStream = useCallback((agentId: string) => {
    const ctrl = abortControllersRef.current.get(agentId);
    if (ctrl) {
      ctrl.abort();
      abortControllersRef.current.delete(agentId);
    }
  }, []);

  const handleSend = useCallback(
    async (textToSend?: string, targetIdOverride?: string, options?: { skipCache?: boolean }) => {
      const targetId = targetIdOverride || selectedId;
      const agent = SANCTUARY_BOTS.find((a) => a.id === targetId) || activeAgent;
      const q = (textToSend ?? inputQuery).trim();
      if (!q || streamingIds[targetId]) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const prevHistory = histories[targetId] || [];
      const historyForPrompt = prevHistory
        .filter((m) => !m.id.startsWith('welcome-'))
        .map((m) => ({
          role: m.sender === 'agent' ? ('agent' as const) : ('user' as const),
          text: m.text,
        }));

      setHistories((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), userMsg],
      }));

      if (!textToSend) {
        setInputQuery('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }

      const controller = new AbortController();
      abortControllersRef.current.set(targetId, controller);
      setStreamingIds((prev) => ({ ...prev, [targetId]: true }));
      setStreamingTextMap((prev) => ({ ...prev, [targetId]: '' }));
      setTypingStepsMap((prev) => ({
        ...prev,
        [targetId]: ['Checking live Panchang & Corpus'],
      }));

      try {
        const result = await streamBotReply(agent, q, historyForPrompt, {
          signal: controller.signal,
          skipCache: options?.skipCache,
          onSteps: (steps) => {
            setTypingStepsMap((prev) => ({ ...prev, [targetId]: steps }));
          },
          onToken: (partial) => {
            setStreamingTextMap((prev) => ({ ...prev, [targetId]: partial }));
          },
        });

        const replyMsg: ChatMessage = {
          id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: 'agent',
          text: result.text,
          steps: result.steps,
          source: result.source,
          model: result.model,
          suggestedLinks: result.suggestedLinks,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setHistories((prev) => ({
          ...prev,
          [targetId]: [...(prev[targetId] || []), replyMsg],
        }));
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          const stoppedText = streamingTextMap[targetId]?.trim();
          if (stoppedText) {
            setHistories((prev) => ({
              ...prev,
              [targetId]: [
                ...(prev[targetId] || []),
                {
                  id: `agent-${Date.now()}`,
                  sender: 'agent',
                  text: `${stoppedText}\n\n*(Stopped)*`,
                  source: 'groq',
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                },
              ],
            }));
          }
        }
      } finally {
        abortControllersRef.current.delete(targetId);
        setStreamingIds((prev) => ({ ...prev, [targetId]: false }));
        setStreamingTextMap((prev) => ({ ...prev, [targetId]: '' }));
        setTypingStepsMap((prev) => ({ ...prev, [targetId]: [] }));
      }
    },
    [selectedId, activeAgent, inputQuery, streamingIds, histories, streamingTextMap]
  );

  useEffect(() => {
    if (initialPrompt && initialPrompt !== handledPromptRef.current) {
      handledPromptRef.current = initialPrompt;
      void handleSend(initialPrompt, initialAgentId);
    }
  }, [initialPrompt, initialAgentId, handleSend]);

  const handleHandoff = (targetId: string) => {
    if (!SANCTUARY_BOTS.some((b) => b.id === targetId)) return;
    setSelectedId(targetId);
    setShowInspector(false);
  };

  const handleClearChat = () => {
    handleStopStream(selectedId);
    clearBotConversationCache(selectedId);
    setHistories((prev) => ({
      ...prev,
      [selectedId]: [
        {
          id: `welcome-${selectedId}-${Date.now()}`,
          sender: 'agent',
          text: activeAgent.greeting,
          timestamp: 'Reset',
        },
      ],
    }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
  };

  const filteredAgents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SANCTUARY_BOTS.filter((a) => {
      if (activeCategory !== 'all' && getBotCategory(a.id) !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.tag.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  const activeCategoryLabel =
    BOT_CATEGORIES.find((c) => c.id === getBotCategory(activeAgent.id))?.shortLabel ||
    'Sanctuary';

  const isDark = theme === 'dark';

  const content = (
    <div
      data-nosnippet
      className="ag-app"
      data-theme={theme}
      style={{ '--ah': activeAgent.hue } as React.CSSProperties}
    >
      {/* Left Bots Navigation Rail (Desktop) */}
      <aside className="ag-pane ag-rail" aria-label="Sanctuary 14 Bots Directory">
        <div className="ag-rail-head">
          <div className="ag-brand">
            <span className="ag-brand-title">AI Sakha Fleet</span>
            <span className="ag-brand-count">{SANCTUARY_BOTS.length} Sahayak</span>
          </div>

          <div className="ag-search">
            <Search className="ag-search-ic" size={14} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search 14 bots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter bots by name or role"
            />
            {searchQuery && (
              <button
                type="button"
                className="ag-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="ag-cat-row" role="tablist" aria-label="Bot category filter">
            {BOT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`ag-cat-pill${activeCategory === cat.id ? ' is-active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="ag-rail-list">
          {filteredAgents.length === 0 ? (
            <div className="ag-empty-filter">
              No bots match &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const isSelected = agent.id === selectedId;
              const isBusy = Boolean(streamingIds[agent.id]);
              return (
                <button
                  key={agent.id}
                  type="button"
                  className={`ag-bot-row${isSelected ? ' is-selected' : ''}`}
                  data-bot-id={agent.id}
                  onClick={() => setSelectedId(agent.id)}
                >
                  <span className="ag-bot-av-box">
                    <SanctuaryBotAvatar
                      agent={agent}
                      size={36}
                      active={isBusy}
                      dark={isDark}
                    />
                  </span>
                  <div className="ag-bot-meta">
                    <div className="ag-bot-title-line">
                      <strong>{agent.name}</strong>
                      <span className="ag-bot-tag-mini">{agent.tag}</span>
                    </div>
                    <span>{agent.role}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Center Conversation Stage */}
      <main className="ag-pane ag-stage" aria-label={`Chat with ${activeAgent.name}`}>
        {/* Mobile Horizontal 14-Bot Switcher Strip */}
        <div className="ag-mobile-strip" aria-label="Quick bot switcher">
          {SANCTUARY_BOTS.map((agent) => {
            const isSelected = agent.id === selectedId;
            return (
              <button
                key={agent.id}
                type="button"
                className={`ag-mobile-chip${isSelected ? ' is-selected' : ''}`}
                onClick={() => setSelectedId(agent.id)}
              >
                <SanctuaryBotAvatar
                  agent={agent}
                  size={32}
                  active={false}
                  dark={isDark}
                />
                <span>{agent.name}</span>
              </button>
            );
          })}
        </div>

        {/* Sticky Workbench Header */}
        <header className="ag-topbar">
          <div className="ag-topbar-id">
            <div className="ag-topbar-av">
              <SanctuaryBotAvatar
                agent={activeAgent}
                size={38}
                active={isCurrentStreaming}
                dark={isDark}
              />
            </div>
            <div className="ag-topbar-copy">
              <div className="ag-topbar-title-row">
                <h2>{activeAgent.name}</h2>
                <span className={`ag-status-pill${isCurrentStreaming ? ' is-busy' : ''}`}>
                  {isCurrentStreaming ? (
                    <>
                      <IOSSpinner size="xs" theme={isDark ? 'white' : 'amber'} />
                      <span>Replying</span>
                    </>
                  ) : (
                    <>
                      <span className="ag-live-dot" aria-hidden="true" />
                      <span>Online</span>
                    </>
                  )}
                </span>
              </div>
              <p>{activeAgent.role}</p>
            </div>
          </div>

          <div className="ag-topbar-actions">
            <button
              type="button"
              className="ag-icon-btn"
              onClick={handleClearChat}
              title="Reset conversation"
              aria-label="Clear current bot conversation"
            >
              <Trash2 size={15} />
            </button>

            <button
              type="button"
              className="ag-icon-btn"
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              title={`Switch to ${isDark ? 'light' : 'dark'} view`}
              aria-label="Toggle Studio Light/Dark theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              className={`ag-icon-btn ag-info-toggle${showInspector ? ' is-active' : ''}`}
              onClick={() => setShowInspector((s) => !s)}
              title="Bot profile & prompts"
              aria-label="Toggle Bot Inspector Sheet"
            >
              <Info size={15} />
            </button>

            {onClose && (
              <button
                type="button"
                className="ag-icon-btn ag-close-btn"
                onClick={onClose}
                title="Close (Esc)"
                aria-label="Close AI Sakha Hub"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Chat Transcript */}
        <div className="ag-messages">
          {currentHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            const isWelcome = msg.id.startsWith('welcome-');
            const stepsOpen = Boolean(expandedSteps[msg.id]);

            return (
              <div key={msg.id} className={`ag-msg ${isUser ? 'user' : 'agent'}`}>
                {!isUser && (
                  <div className="ag-msg-av">
                    <SanctuaryBotAvatar
                      agent={activeAgent}
                      size={30}
                      active={false}
                      dark={isDark}
                    />
                  </div>
                )}

                <div className="ag-msg-col">
                  <div className="ag-bubble">
                    {isUser ? (
                      <span className="ag-user-text">{msg.text}</span>
                    ) : (
                      <RichBotMessageBody text={msg.text} onCloseModal={onClose} />
                    )}
                  </div>

                  {/* Grounded Deep Links (if any) */}
                  {!isUser && msg.suggestedLinks && msg.suggestedLinks.length > 0 && (
                    <div className="ag-msg-links">
                      {msg.suggestedLinks.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className="ag-route-chip"
                          onClick={(e) => {
                            e.preventDefault();
                            navigateSpaRoute(link.href, onClose);
                          }}
                        >
                          <span>{link.label}</span>
                          <ArrowUpRight size={12} />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Footer metadata & actions cleanly aligned UNDER the bubble */}
                  {!isUser && (!isWelcome || msg.source) && (
                    <div className="ag-msg-footer">
                      {msg.source && (
                        <span className="ag-source-tag" data-source={msg.source}>
                          {SOURCE_LABEL_MAP[msg.source]}
                        </span>
                      )}

                      <button
                        type="button"
                        className="ag-meta-btn"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        aria-label="Copy message"
                      >
                        {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {msg.steps && msg.steps.length > 0 && (
                        <button
                          type="button"
                          className="ag-meta-btn"
                          onClick={() =>
                            setExpandedSteps((prev) => ({
                              ...prev,
                              [msg.id]: !prev[msg.id],
                            }))
                          }
                        >
                          <span>Sources ({msg.steps.length})</span>
                          <ChevronDown
                            size={12}
                            style={{
                              transform: stepsOpen ? 'rotate(180deg)' : 'none',
                              transition: 'transform 160ms ease',
                            }}
                          />
                        </button>
                      )}
                    </div>
                  )}

                  {stepsOpen && msg.steps && msg.steps.length > 0 && (
                    <ul className="ag-steps-list">
                      {msg.steps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live Streaming Row */}
          {isCurrentStreaming && (
            <div className="ag-msg agent">
              <div className="ag-msg-av">
                <SanctuaryBotAvatar
                  agent={activeAgent}
                  size={30}
                  active={true}
                  dark={isDark}
                />
              </div>

              <div className="ag-msg-col">
                <div className="ag-bubble ag-bubble-streaming">
                  <div className="ag-stream-status">
                    <IOSSpinner size="xs" theme={isDark ? 'white' : 'amber'} />
                    <span>
                      {currentStreamingText
                        ? `${activeAgent.name} is replying...`
                        : currentTypingSteps[currentTypingSteps.length - 1] ||
                          `${activeAgent.name} is looking this up...`}
                    </span>
                  </div>
                  {currentStreamingText && (
                    <div className="ag-stream-body">
                      <RichBotMessageBody
                        text={currentStreamingText}
                        onCloseModal={onClose}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sticky Composer Area */}
        <footer className="ag-composer-wrap">
          <div className="ag-suggestions" aria-label="Suggested questions">
            {activeAgent.prompts.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                className="ag-chip"
                disabled={isCurrentStreaming}
                onClick={() => void handleSend(promptText)}
              >
                {promptText}
              </button>
            ))}
          </div>

          <div className="ag-composer">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={`Ask ${activeAgent.name} about Darshan, verses, Panchang, or seva...`}
              value={inputQuery}
              onChange={(e) => {
                setInputQuery(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />

            {isCurrentStreaming ? (
              <button
                type="button"
                className="ag-send ag-stop"
                onClick={() => handleStopStream(selectedId)}
                aria-label="Stop response"
                title="Stop generating"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                className="ag-send"
                disabled={!inputQuery.trim() || isCurrentStreaming}
                aria-busy={isCurrentStreaming ? 'true' : 'false'}
                onClick={() => void handleSend()}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            )}
          </div>
        </footer>
      </main>

      {/* Right Profile / Context Inspector */}
      <aside
        className={`ag-pane ag-inspector${showInspector ? ' is-open' : ''}`}
        aria-label={`${activeAgent.name} Inspector`}
      >
        <div className="ag-insp-top">
          <span className="ag-insp-cat">{activeCategoryLabel}</span>
          {showInspector && (
            <button
              type="button"
              className="ag-icon-btn"
              onClick={() => setShowInspector(false)}
              aria-label="Close inspector"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="ag-insp-card">
          <SanctuaryBotAvatar
            agent={activeAgent}
            size={68}
            active={isCurrentStreaming}
            dark={isDark}
          />
          <h3>{activeAgent.name}</h3>
          <p className="ag-insp-role">{activeAgent.role}</p>
          <p className="ag-insp-bio">{activeAgent.tip}</p>

          <a
            href={activeSectionHome.href}
            className="ag-insp-section-link"
            onClick={(e) => {
              e.preventDefault();
              navigateSpaRoute(activeSectionHome.href, onClose);
            }}
          >
            <span>Open {activeSectionHome.label}</span>
            <ArrowUpRight size={13} />
          </a>
        </div>

        <div className="ag-insp-section">
          <h4>Try Asking</h4>
          <div className="ag-insp-list">
            {activeAgent.prompts.map((p, i) => (
              <button
                key={i}
                type="button"
                className="ag-insp-btn"
                disabled={isCurrentStreaming}
                onClick={() => {
                  setShowInspector(false);
                  void handleSend(p);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {activeAgent.handoff && (
          <div className="ag-insp-section">
            <h4>Hands Off To</h4>
            <button
              type="button"
              className="ag-handoff-btn"
              onClick={() => handleHandoff(activeAgent.handoff![0])}
            >
              <span>{activeAgent.handoff[1]}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        )}

        <div className="ag-insp-footer">
          <button type="button" className="ag-clear-btn" onClick={handleClearChat}>
            <Trash2 size={13} />
            <span>Clear chat &amp; local cache</span>
          </button>
        </div>
      </aside>
    </div>
  );

  if (isModal) {
    return (
      <div className="ag-modal-backdrop" onClick={onClose}>
        <div className="ag-modal-wrap" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default AgentHub;
