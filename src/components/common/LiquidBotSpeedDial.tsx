import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Sparkles,
  X,
  Send,
  Square,
  Users,
  Trash2,
  ArrowUpRight,
  Copy,
  Check,
} from 'lucide-react';
import { type BotAvatarState } from 'bot-avatars';
import { SANCTUARY_BOTS, type SanctuaryBotAgent } from '../../data/botRoster';
import { SanctuaryBotAvatar } from './SanctuaryBotAvatar';
import { IOSSpinner } from './IOSActivityIndicator';
import { getIstParts } from '../../services/panchangService';
import {
  streamBotReply,
  clearBotConversationCache,
  normalizeReplyLines,
  parseRichInlineSegments,
  navigateSpaRoute,
  type BotResponseSource,
  type BotSuggestedLink,
} from '../../services/botGroqEngine';
import { queueAgentEvent } from '../../utils/agentQueue';
import './LiquidBotSpeedDial.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  source?: BotResponseSource;
  suggestedLinks?: BotSuggestedLink[];
  aborted?: boolean;
}

interface LiquidBotSpeedDialProps {
  onOpenSearch?: () => void;
  onNavigatePadavali?: () => void;
  hasFloatingAudio?: boolean;
}

const SOURCE_SHORT_MAP: Record<BotResponseSource, string> = {
  groq: 'Verified',
  'edge-groq': 'Verified',
  cache: 'Cached · Instant',
  local: 'Offline Grounded',
};

export const LiquidBotSpeedDial: React.FC<LiquidBotSpeedDialProps> = ({
  onOpenSearch,
  onNavigatePadavali,
  hasFloatingAudio = false,
}) => {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<SanctuaryBotAgent>(SANCTUARY_BOTS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messagesByAgent, setMessagesByAgent] = useState<Record<string, ChatMessage[]>>(() => {
    const map: Record<string, ChatMessage[]> = {};
    SANCTUARY_BOTS.forEach((b) => {
      map[b.id] = [
        {
          id: `welcome-${b.id}`,
          sender: 'agent',
          text: b.greeting,
          timestamp: 'Ready',
        },
      ];
    });
    return map;
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [typingSteps, setTypingSteps] = useState<string[]>([]);
  const [isIdleSleep, setIsIdleSleep] = useState(false);
  const [isNightRest, setIsNightRest] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const messages = messagesByAgent[currentAgent.id] || [];

  const wakeFromIdle = useCallback(() => {
    setIsIdleSleep(false);
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      setIsIdleSleep(true);
    }, 26000);
  }, []);

  useEffect(() => {
    const syncConditions = () => {
      const { minutesOfDay } = getIstParts(new Date());
      setIsNightRest(minutesOfDay >= 1320 || minutesOfDay < 210);
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    syncConditions();
    wakeFromIdle();
    const tick = window.setInterval(syncConditions, 60000);
    document.addEventListener('visibilitychange', syncConditions);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', syncConditions);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [wakeFromIdle]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (dialRef.current && !dialRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ agentId?: string }>)?.detail;
      if (detail?.agentId) {
        const matched = SANCTUARY_BOTS.find((b) => b.id === detail.agentId);
        if (matched) setCurrentAgent(matched);
      }
      setModalOpen(true);
      setOpen(false);
    };
    window.addEventListener('open-sanctuary-assistant', handleOpen);
    return () => window.removeEventListener('open-sanctuary-assistant', handleOpen);
  }, []);

  useEffect(() => {
    if (modalOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [modalOpen, messages.length, streamingText, isTyping]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const handleAction = (type: 'assistant' | 'search' | 'padavali') => {
    setOpen(false);
    if (type === 'assistant') {
      setModalOpen(true);
    } else if (type === 'search') {
      onOpenSearch?.();
    } else if (type === 'padavali') {
      onNavigatePadavali?.();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend ?? inputQuery).trim();
    if (!q || isTyping) return;
    wakeFromIdle();

    const agentId = currentAgent.id;
    const prevMsgs = messagesByAgent[agentId] || [];
    const historyForPrompt = prevMsgs
      .filter((m) => !m.id.startsWith('welcome-'))
      .map((m) => ({
        role: m.sender === 'agent' ? ('agent' as const) : ('user' as const),
        text: m.text,
      }));

    setMessagesByAgent((prev) => ({
      ...prev,
      [agentId]: [
        ...(prev[agentId] || []),
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: q,
          timestamp: 'Now',
        },
      ],
    }));

    if (!textToSend) setInputQuery('');
    setIsTyping(true);
    setStreamingText('');
    setTypingSteps(['Checking Panchang & Corpus...']);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const reply = await streamBotReply(currentAgent, q, historyForPrompt, {
        signal: ctrl.signal,
        onSteps: setTypingSteps,
        onToken: setStreamingText,
      });

      setMessagesByAgent((prev) => ({
        ...prev,
        [agentId]: [
          ...(prev[agentId] || []),
          {
            id: `agent-${Date.now()}`,
            sender: 'agent',
            text: reply.text,
            source: reply.source,
            suggestedLinks: reply.suggestedLinks,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ],
      }));
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        const stoppedText = streamingText.trim();
        setMessagesByAgent((prev) => ({
          ...prev,
          [agentId]: [
            ...(prev[agentId] || []),
            {
              id: `agent-${Date.now()}`,
              sender: 'agent',
              text: stoppedText || 'Stopped for now — tap a prompt or message again anytime.',
              source: stoppedText ? 'groq' : undefined,
              timestamp: 'Stopped',
              aborted: true,
            },
          ],
        }));
      }
    } finally {
      abortRef.current = null;
      setIsTyping(false);
      setStreamingText('');
      setTypingSteps([]);
    }
  };

  const handleClear = () => {
    stopGeneration();
    clearBotConversationCache(currentAgent.id);
    setMessagesByAgent((prev) => ({
      ...prev,
      [currentAgent.id]: [
        {
          id: `welcome-${currentAgent.id}-${Date.now()}`,
          sender: 'agent',
          text: currentAgent.greeting,
          timestamp: 'Reset',
        },
      ],
    }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1400);
  };

  const latestAgentMessage = [...messages].reverse().find((m) => m.sender === 'agent');
  const activeBotState: BotAvatarState = isTyping
    ? 'working'
    : isTabHidden || isIdleSleep || isNightRest || Boolean(latestAgentMessage?.aborted)
      ? 'sleeping'
      : 'default';

  const renderInlineBody = (text: string) => {
    return normalizeReplyLines(text).map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="bot-rich-gap" aria-hidden="true" />;
      const segs = parseRichInlineSegments(trimmed);
      return (
        <div key={i} className="bot-rich-line">
          {segs.map((seg, j) => {
            if (seg.type === 'bold') return <strong key={j}>{seg.value}</strong>;
            if (seg.type === 'italic') return <em key={j}>{seg.value}</em>;
            if (seg.type === 'link') {
              return (
                <a
                  key={j}
                  href={seg.href}
                  className="bot-inline-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateSpaRoute(seg.href, () => setModalOpen(false));
                  }}
                >
                  {seg.value}
                </a>
              );
            }
            return <React.Fragment key={j}>{seg.value}</React.Fragment>;
          })}
        </div>
      );
    });
  };

  return (
    <>
      <div
        data-nosnippet
        ref={dialRef}
        className={`liquid-speed-dial-anchor ${hasFloatingAudio ? 'has-audio-bar' : ''}`}
      >
        <div className={`fast-dial-stack ${open ? 'is-open' : ''}`}>
          <button
            type="button"
            className="round-btn fast-dial-item"
            style={{ '--dx': '-64px', '--dy': '0px' } as React.CSSProperties}
            onClick={() => handleAction('padavali')}
            title="Open Padavali"
            aria-label="Open Padavali Scriptures"
            tabIndex={open ? 0 : -1}
          >
            <BookOpen className="w-4 h-4 text-[#FEF08A]" />
          </button>

          <button
            type="button"
            className="round-btn fast-dial-item"
            style={{ '--dx': '-48px', '--dy': '-48px' } as React.CSSProperties}
            onClick={() => handleAction('search')}
            title="Spotlight Search"
            aria-label="Search Sacred Corpus"
            tabIndex={open ? 0 : -1}
          >
            <Sparkles className="w-4 h-4 text-[#FEF08A]" />
          </button>

          <button
            type="button"
            className="round-btn fast-dial-item"
            style={{ '--dx': '0px', '--dy': '-64px' } as React.CSSProperties}
            onClick={() => handleAction('assistant')}
            title={`Quick Chat (${currentAgent.name})`}
            aria-label="Open Quick Bot Chat"
            tabIndex={open ? 0 : -1}
          >
            <Users className="w-4 h-4 text-[#FEF08A]" />
          </button>

          <button
            type="button"
            className="round-btn round-btn-main"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close bot launcher' : 'Open interactive bots'}
            title="14 Sanctuary Sahayak Bots"
          >
            {open ? (
              <X className="w-5 h-5 text-[#FEF08A]" />
            ) : (
              <SanctuaryBotAvatar
                agent={currentAgent}
                size={34}
                animated={true}
                working={isTyping}
                state={activeBotState}
              />
            )}
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          data-nosnippet
          className="bot-assistant-backdrop"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bot-assistant-title"
        >
          <div
            className="bot-assistant-card"
            onClick={(e) => e.stopPropagation()}
            onPointerMove={wakeFromIdle}
            onKeyDown={wakeFromIdle}
          >
            <div className="bot-assistant-header">
              <div className="bot-assistant-brand">
                <div className="bot-assistant-av-wrap">
                  <SanctuaryBotAvatar
                    agent={currentAgent}
                    size={36}
                    animated={true}
                    working={isTyping}
                    state={activeBotState}
                  />
                </div>
                <div className="bot-assistant-title-col">
                  <div className="bot-assistant-title-row">
                    <h4 id="bot-assistant-title">{currentAgent.name}</h4>
                  </div>
                  <p>{currentAgent.role}</p>
                </div>
              </div>

              <div className="bot-header-actions">
                <button
                  type="button"
                  className="bot-hdr-icon-btn"
                  onClick={handleClear}
                  title="Clear conversation"
                  aria-label="Clear quick chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="bot-hdr-icon-btn"
                  onClick={() => {
                    setModalOpen(false);
                    queueAgentEvent('open-agent-hub', { agentId: currentAgent.id });
                    window.dispatchEvent(
                      new CustomEvent('open-agent-hub', { detail: { agentId: currentAgent.id } })
                    );
                  }}
                  title="Open Full 14-Bot Hub"
                  aria-label="Expand to Full 14-Bot Hub"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="bot-hdr-icon-btn bot-hdr-close"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close bot assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clean 14-bot quick switcher rail with faded scroll edge */}
            <div className="bot-assistant-switcher">
              {SANCTUARY_BOTS.map((bot) => (
                <button
                  key={bot.id}
                  type="button"
                  className={`bot-switch-pill ${currentAgent.id === bot.id ? 'active' : ''}`}
                  onClick={() => setCurrentAgent(bot)}
                >
                  {bot.name}
                </button>
              ))}
            </div>

            <div className="bot-assistant-messages">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isWelcome = msg.id.startsWith('welcome-');
                const isLatestAgentMsg = !isUser && latestAgentMessage?.id === msg.id;
                const msgState: BotAvatarState = msg.aborted
                  ? 'sleeping'
                  : isLatestAgentMsg && !isTyping
                    ? activeBotState
                    : 'default';
                return (
                  <div key={msg.id} className={`bot-msg ${isUser ? 'user' : 'agent'}`}>
                    {!isUser && (
                      <div className="bot-msg-av" data-bot-state={msgState}>
                        <SanctuaryBotAvatar
                          agent={currentAgent}
                          size={24}
                          animated={isLatestAgentMsg && !isTyping}
                          state={msgState}
                        />
                      </div>
                    )}

                    <div className="bot-msg-col">
                      <div className="bot-msg-bubble">
                        {isUser ? msg.text : renderInlineBody(msg.text)}
                      </div>

                      {!isUser && msg.suggestedLinks && msg.suggestedLinks.length > 0 && (
                        <div className="bot-msg-links">
                          {msg.suggestedLinks.map((lnk) => (
                            <a
                              key={lnk.href}
                              href={lnk.href}
                              className="bot-route-pill"
                              onClick={(e) => {
                                e.preventDefault();
                                navigateSpaRoute(lnk.href, () => setModalOpen(false));
                              }}
                            >
                              {lnk.label} ↗
                            </a>
                          ))}
                        </div>
                      )}

                      {!isUser && !isWelcome && (
                        <div className="bot-msg-meta">
                          {msg.source && (
                            <span className="bot-msg-src" data-source={msg.source}>
                              {SOURCE_SHORT_MAP[msg.source]}
                            </span>
                          )}
                          <button
                            type="button"
                            className="bot-copy-btn"
                            onClick={() => handleCopy(msg.id, msg.text)}
                          >
                            {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="bot-msg agent">
                  <div className="bot-msg-av">
                    <SanctuaryBotAvatar
                      agent={currentAgent}
                      size={24}
                      animated={true}
                      working={true}
                    />
                  </div>
                  <div className="bot-msg-col">
                    <div className="bot-streaming-box">
                      <div className="bot-streaming-orb-row">
                        <IOSSpinner size="xs" theme="amber" />
                        <span className="bot-streaming-pill">
                          {streamingText
                            ? `${currentAgent.name} is replying...`
                            : typingSteps[typingSteps.length - 1] || 'Synthesizing...'}
                        </span>
                      </div>
                      {streamingText && (
                        <div className="bot-streaming-preview">
                          {renderInlineBody(streamingText)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="bot-assistant-footer">
              <div className="bot-prompts-row">
                {currentAgent.prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="bot-prompt-chip"
                    disabled={isTyping}
                    onClick={() => void handleSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="bot-chat-input-shell">
                <input
                  type="text"
                  placeholder={`Ask ${currentAgent.name}...`}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                {isTyping ? (
                  <button
                    type="button"
                    className="bot-send-btn is-stop"
                    onClick={stopGeneration}
                    aria-label="Stop response"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="bot-send-btn"
                    disabled={!inputQuery.trim() || isTyping}
                    aria-busy={isTyping ? 'true' : 'false'}
                    onClick={() => void handleSend()}
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
