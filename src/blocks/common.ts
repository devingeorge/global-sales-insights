import { KnownBlock } from '@slack/types';

export const dividerBlock = (): KnownBlock => ({
  type: 'divider',
});

export const markdownSection = (text: string): KnownBlock => ({
  type: 'section',
  text: {
    type: 'mrkdwn',
    text,
  },
});

export const spacer = (): KnownBlock => ({
  type: 'context',
  elements: [
    {
      type: 'mrkdwn',
      text: '\u200b',
    },
  ],
});
