import React from 'react';
import { BotAvatar, type BotAvatarState } from 'bot-avatars';
import type { SanctuaryBotAgent } from '../../data/botRoster';

export interface SanctuaryBotAvatarProps {
  agent: SanctuaryBotAgent;
  size?: number;
  /** Enables animated movement/blinking (kept active on active header/latest bot, paused on static list items). */
  animated?: boolean;
  /** Forces the active `working` hop/spin animation state (e.g. while replying or streaming). */
  working?: boolean;
  /** Explicit lifecycle state override (`'default' | 'working' | 'sleeping'`). */
  state?: BotAvatarState;
  dark?: boolean;
  className?: string;
}

/**
 * Crisp character avatar wrapper over `bot-avatars`.
 * Uses real crisp characters (zero fur/plastic/hats/headphones/glasses),
 * supports condition-driven `'working' | 'default' | 'sleeping'` states,
 * and pauses inactive instances to protect mobile FPS.
 */
export const SanctuaryBotAvatar: React.FC<SanctuaryBotAvatarProps> = ({
  agent,
  size = 40,
  animated = false,
  working = false,
  state,
  dark = false,
  className = '',
}) => {
  const resolvedState: BotAvatarState = working ? 'working' : state || 'default';
  const shouldPause = !animated && resolvedState !== 'working';
  const isSleeping = resolvedState === 'sleeping';

  return (
    <BotAvatar
      type={agent.type}
      face={agent.face}
      hat="none"
      glasses="none"
      headphones={false}
      bowTie={false}
      shading="crisp"
      state={resolvedState}
      paused={shouldPause}
      interactive={animated && !isSleeping}
      speed={isSleeping ? 0.72 : 1}
      jumpEvery={0}
      turn={animated && !isSleeping ? 0.35 : 0}
      theme={dark ? 'dark' : 'light'}
      size={size}
      className={className}
      aria-label={agent.name}
    />
  );
};
