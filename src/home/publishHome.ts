import { WebClient } from '@slack/web-api';
import { UserPreference } from '../store/userPrefs';
import { dividerBlock, markdownSection } from '../blocks/common';
import { getUserPreference } from '../store/userPrefs';

interface PublishHomeArgs {
  client: WebClient;
  userId: string;
}

export async function publishHome({ client, userId }: PublishHomeArgs) {
  const preference = getUserPreference(userId);
  const blocks = buildHomeBlocks(preference);

  await client.views.publish({
    user_id: userId,
    view: {
      type: 'home',
      blocks,
    },
  });
}

function buildHomeBlocks(preference: UserPreference) {
  const intro = [
    markdownSection(
      '*✨ Welcome to your Sales Intelligence Home ✨*\nThe Global Sales Insights app enables you to self-serve insights, intelligence, and data-driven decks on your accounts to drive pipeline & ACV.'
    ),
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Key Use Cases (4 min)' },
          action_id: 'key_use_cases',
          url: 'https://www.salesforce.com/resources/',
        },
      ],
    },
    dividerBlock(),
  ];

  const viewAs = {
    type: 'section' as const,
    text: {
      type: 'mrkdwn',
      text: '*Action Hub*\nSelect the Sales Leader or AE/BDR persona you would like to view the data as.',
    },
    accessory: {
      type: 'users_select',
      placeholder: { type: 'plain_text', text: 'View As' },
      action_id: 'home_view_as_select',
      initial_user: preference.viewAsUserId,
    },
  };

  const actionHubDescriptions = markdownSection(
    '*Account Insights Menu*: explore account intelligence (PTB, funding, technographics).\n*Deck Automation (Midas)*: generate data-driven presentations in Slack minutes.\n*Exec Meeting Brief*: automatically generate a meeting brief with customer insights.\n*Release Notes*: latest updates from the Sales Intelligence & GSI world.'
  );

  const actionHubButtons = {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Account Insights Menu' },
        action_id: 'action_account_insights',
        value: 'disabled',
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Deck Automation (Midas)' },
        action_id: 'action_deck_automation',
        value: 'disabled',
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Executive Meeting Brief' },
        style: 'primary',
        action_id: 'action_executive_brief',
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Release Notes' },
        action_id: 'action_release_notes',
        value: 'disabled',
      },
    ],
  };

  const settingsBlock = {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: 'Settings' },
        action_id: 'action_settings',
      },
    ],
  };

  return [...intro, viewAs, actionHubButtons, actionHubDescriptions, dividerBlock(), settingsBlock];
}
