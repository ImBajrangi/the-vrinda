import React, { useState, useRef, useEffect } from 'react';
import { Liquid } from 'liquid-gooey';
import { BotAvatar } from 'bot-avatars';
import { BorderBeam } from 'border-beam';
import { ThinkingOrb } from 'thinking-orbs';
import { BookOpen, Sparkles, X, Send, Zap, Users } from 'lucide-react';
import { assistantCache } from '../../services/assistantCache';
import { SANCTUARY_BOTS, type SanctuaryBotAgent } from '../../data/botRoster';
import { resolveBotReply } from '../../services/botBrain';
import { queueAgentEvent } from '../../utils/agentQueue';
import './LiquidBotSpeedDial.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface LiquidBotSpeedDialProps {
  onOpenSearch?: () => void;
  onNavigatePadavali?: () => void;
  hasFloatingAudio?: boolean;
}

export const LiquidBotSpeedDial: React.FC<LiquidBotSpeedDialProps> = ({
  onOpenSearch,
  onNavigatePadavali,
  hasFloatingAudio = false,
}) => {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [botState, setBotState] = useState<'default' | 'working' | 'sleeping'>('default');
  const [currentAgent, setCurrentAgent] = useState<SanctuaryBotAgent>(SANCTUARY_BOTS[0]);
  const [assistantShading, setAssistantShading] = useState<'plastic' | 'fabric'>(
    SANCTUARY_BOTS[0].shading === 'fabric' ? 'fabric' : 'plastic'
  );

  const toggleAssistantShading = () => {
    setAssistantShading((prev) => (prev === 'plastic' ? 'fabric' : 'plastic'));
  };

  useEffect(() => {
    setAssistantShading(currentAgent.shading === 'fabric' ? 'fabric' : 'plastic');
  }, [currentAgent]);

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: SANCTUARY_BOTS[0].greeting,
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const streamingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (modalOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, modalOpen, streamingText]);

  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ agentId?: string }>;
      setModalOpen(true);
      if (customEvent.detail?.agentId) {
        const found = SANCTUARY_BOTS.find((a) => a.id === customEvent.detail?.agentId);
        if (found) {
          setCurrentAgent(found);
          setBotState('default');
        }
      }
    };
    window.addEventListener('open-sanctuary-assistant', handleOpen);
    return () => window.removeEventListener('open-sanctuary-assistant', handleOpen);
  }, []);

  const switchAgent = (agent: SanctuaryBotAgent) => {
    setCurrentAgent(agent);
    setMessages((prev) => [
      ...prev,
      {
        id: `agent-switch-${Date.now()}`,
        sender: 'assistant',
        text: `Switched to ${agent.name} (${agent.role}): "${agent.greeting}"`,
        timestamp: 'Just now',
      },
    ]);
  };

  const handleAction = (type: 'chat' | 'search' | 'fleet' | 'padavali') => {
    setOpen(false);
    if (type === 'chat') {
      setModalOpen(true);
      setBotState('default');
    } else if (type === 'fleet') {
      queueAgentEvent('open-agent-hub', { agentId: currentAgent.id });
      window.dispatchEvent(new CustomEvent('open-agent-hub', { detail: { agentId: currentAgent.id } }));
    } else if (type === 'search') {
      onOpenSearch?.();
    } else if (type === 'padavali') {
      onNavigatePadavali?.();
    }
  };

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: q, timestamp: 'Now' },
    ]);
    setInputQuery('');
    setIsTyping(true);
    setBotState('working');
    setStreamingText('');

    const cacheKey = `dial_${currentAgent.id}_${q}`;
    const cachedResponse = assistantCache.get<string>(cacheKey);
    const fullResponse = cachedResponse || resolveBotReply(currentAgent, q).text;
    const isFromCache = Boolean(cachedResponse);
    if (!cachedResponse) {
      assistantCache.set(cacheKey, fullResponse);
    }

    const words = fullResponse.split(' ');
    let currentIdx = 0;
    const intervalTime = isFromCache ? 18 : 28;

    if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);

    streamingTimerRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx <= words.length) {
        setStreamingText(words.slice(0, currentIdx).join(' '));
      } else {
        if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: fullResponse,
            timestamp: isFromCache ? 'Cached L1' : 'Just now',
          },
        ]);
        setIsTyping(false);
        setStreamingText('');
        setBotState('default');
      }
    }, intervalTime);
  };

  return (
    <>
      <div
        className={`liquid-speed-dial-anchor ${hasFloatingAudio ? 'has-audio-bar' : ''}`}
        role="region"
        aria-label="Interactive AI Bots Launcher"
      >
        <Liquid
          fill="#1C140D"
          style={{ width: 140, height: 140, position: 'relative', pointerEvents: 'none' }}
        >
          <Liquid.Item
            style={{ position: 'absolute', right: 12, bottom: 12, pointerEvents: open ? 'auto' : 'none' }}
            x={open ? -64 : 0}
            y={0}
            transition={{ duration: open ? 290 : 210, ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <button
              type="button"
              className="round-btn"
              onClick={() => handleAction('fleet')}
              aria-label="Open All 14 Bots Hub"
              data-label="All 14 Bots Hub"
              tabIndex={open ? 0 : -1}
              style={{ opacity: open ? 1 : 0, transition: 'opacity 0.15s ease' }}
            >
              <Users size={19} color="#FEF08A" />
            </button>
          </Liquid.Item>

          <Liquid.Item
            style={{ position: 'absolute', right: 12, bottom: 12, pointerEvents: open ? 'auto' : 'none' }}
            x={open ? -48 : 0}
            y={open ? -48 : 0}
            transition={{ duration: open ? 290 : 210, ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            delay={open ? 18 : 10}
          >
            <button
              type="button"
              className="round-btn"
              onClick={() => handleAction('padavali')}
              aria-label="Open Padavali"
              data-label="Padavali"
              tabIndex={open ? 0 : -1}
              style={{ opacity: open ? 1 : 0, transition: 'opacity 0.15s ease' }}
            >
              <BookOpen size={19} color="#6EE7B7" />
            </button>
          </Liquid.Item>

          <Liquid.Item
            style={{ position: 'absolute', right: 12, bottom: 12, pointerEvents: open ? 'auto' : 'none' }}
            x={0}
            y={open ? -64 : 0}
            transition={{ duration: open ? 290 : 210, ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            delay={open ? 36 : 0}
          >
            <button
              type="button"
              className="round-btn"
              onClick={() => handleAction('chat')}
              aria-label="Quick Bot Chat"
              data-label="Quick Bot Chat"
              tabIndex={open ? 0 : -1}
              style={{ opacity: open ? 1 : 0, transition: 'opacity 0.15s ease' }}
            >
              <Sparkles size={19} color="#FBBF24" />
            </button>
          </Liquid.Item>

          <Liquid.Item style={{ position: 'absolute', right: 12, bottom: 12, pointerEvents: 'auto' }}>
            <button
              type="button"
              className="round-btn round-btn-main"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? 'Close bot launcher' : 'Open interactive bots'}
            >
              {open ? (
                <span style={{ fontSize: 22, lineHeight: 1, color: '#FEF08A' }}>×</span>
              ) : (
                <BotAvatar
                  type={currentAgent.type}
                  face={currentAgent.face}
                  hat={currentAgent.hat}
                  glasses={currentAgent.glasses}
                  headphones={currentAgent.headphones}
                  bowTie={currentAgent.bowTie}
                  shading={assistantShading}
                  size={36}
                  state="default"
                />
              )}
            </button>
          </Liquid.Item>
        </Liquid>
      </div>

      {modalOpen && (
        <div className="bot-assistant-overlay" onClick={() => setModalOpen(false)}>
          <BorderBeam size="md" colorVariant="sunset" strength={0.65} theme="light" borderRadius={24}>
            <div
              className="bot-assistant-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="bot-assistant-title"
            >
              <div className="bot-assistant-header">
                <div className="bot-avatar-hero-container">
                  <BotAvatar
                    type={currentAgent.type}
                    face={currentAgent.face}
                    hat={currentAgent.hat}
                    glasses={currentAgent.glasses}
                    headphones={currentAgent.headphones}
                    bowTie={currentAgent.bowTie}
                    shading={assistantShading}
                    size={42}
                    state={botState}
                  />
                </div>

                <div className="bot-header-meta">
                  <div className="bot-header-title-row">
                    <h3 id="bot-assistant-title" className="bot-header-title">
                      {currentAgent.name}
                    </h3>
                    <span className={`bot-state-indicator-badge ${botState}`}>
                      {currentAgent.tag}
                    </span>
                    <button
                      type="button"
                      onClick={toggleAssistantShading}
                      className="bot-shading-toggle-btn"
                    >
                      {assistantShading === 'fabric' ? 'Fabric' : 'Plastic'}
                    </button>
                  </div>
                  <p className="bot-header-subtitle">{currentAgent.role}</p>
                </div>

                <button
                  type="button"
                  className="bot-close-btn"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close Assistant"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bot-state-bar">
                <div className="bot-state-tabs">
                  {SANCTUARY_BOTS.map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      className={`bot-state-tab-btn ${currentAgent.id === ag.id ? 'active' : ''}`}
                      onClick={() => switchAgent(ag)}
                    >
                      {ag.name}
                    </button>
                  ))}
                </div>

                <div className="bot-cache-indicator">
                  <Zap size={10} />
                  <span>L1</span>
                </div>
              </div>

              <div className="bot-chat-feed">
                {messages.map((msg) => (
                  <div key={msg.id} className={`bot-message-row ${msg.sender}`}>
                    {msg.sender === 'assistant' && (
                      <BotAvatar
                        type={currentAgent.type}
                        face={currentAgent.face}
                        hat={currentAgent.hat}
                        glasses={currentAgent.glasses}
                        headphones={currentAgent.headphones}
                        bowTie={currentAgent.bowTie}
                        shading={currentAgent.shading}
                        size={28}
                        state="default"
                      />
                    )}
                    <div className={`bot-message-bubble ${msg.sender}`}>{msg.text}</div>
                  </div>
                ))}

                {isTyping && (
                  <div className="bot-message-row assistant">
                    <BotAvatar
                      type={currentAgent.type}
                      face={currentAgent.face}
                      hat={currentAgent.hat}
                      glasses={currentAgent.glasses}
                      headphones={currentAgent.headphones}
                      bowTie={currentAgent.bowTie}
                      shading={assistantShading}
                      size={28}
                      state="working"
                    />
                    <div style={{ flex: 1, maxWidth: '82%' }}>
                      <BorderBeam
                        size="md"
                        colorVariant="colorful"
                        strength={0.75}
                        borderRadius={18}
                        theme="light"
                        active={true}
                      >
                        <div className="bot-message-bubble assistant bot-streaming-bubble">
                          <div className="bot-streaming-header">
                            <ThinkingOrb
                              state={streamingText ? 'composing' : 'searching'}
                              size={20}
                              color="#B45309"
                            />
                            <span className="bot-streaming-agent-name">{currentAgent.name}</span>
                            <span className="bot-streaming-pill">
                              {streamingText ? 'Composing...' : 'Thinking...'}
                            </span>
                          </div>
                          <div className="bot-streaming-content">
                            {streamingText ? (
                              <>
                                {streamingText}
                                <span className="bot-streaming-cursor" />
                              </>
                            ) : (
                              <div className="bot-streaming-skeleton">
                                <div className="bot-skeleton-line short" />
                                <div className="bot-skeleton-line long" />
                                <div className="bot-skeleton-line medium" />
                              </div>
                            )}
                          </div>
                        </div>
                      </BorderBeam>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              <div className="bot-suggestions-scroll">
                {currentAgent.prompts.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="bot-suggestion-chip"
                    onClick={() => handleSend(chip)}
                  >
                    {chip}
                  </button>
                ))}
                <button
                  type="button"
                  className="bot-suggestion-chip"
                  onClick={() => {
                    setModalOpen(false);
                    queueAgentEvent('open-agent-hub', { agentId: currentAgent.id });
                    window.dispatchEvent(new CustomEvent('open-agent-hub', { detail: { agentId: currentAgent.id } }));
                  }}
                >
                  Open Full 14-Bot Hub ↗
                </button>
              </div>

              <div className="bot-chat-input-wrapper">
                <BorderBeam
                  size="md"
                  colorVariant="colorful"
                  strength={inputQuery.trim().length > 0 || isTyping ? 0.8 : 0.25}
                  active={inputQuery.trim().length > 0 || isTyping}
                  borderRadius={16}
                  theme="light"
                >
                  <div className={`bot-chat-input-bar ${isTyping ? 'is-generating' : ''}`}>
                    <input
                      type="text"
                      className="bot-input-field"
                      placeholder={`Ask ${currentAgent.name} about verses, darshan, panchang, or bots...`}
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      disabled={isTyping}
                    />
                    <button
                      type="button"
                      className="bot-send-btn"
                      onClick={() => handleSend()}
                      disabled={!inputQuery.trim() || isTyping}
                      aria-label="Send query"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </BorderBeam>
              </div>
            </div>
          </BorderBeam>
        </div>
      )}
    </>
  );
};
