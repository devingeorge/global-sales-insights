import { View, WebClient, KnownBlock } from '@slack/web-api';
import { getUserPreference } from '../../store/userPrefs';
import { DataSourceOption } from '../../types';

interface OpenTemplateModalArgs {
  client: WebClient;
  triggerId: string;
  userId: string;
}

export async function openTemplateModal({ client, triggerId, userId }: OpenTemplateModalArgs) {
  const preference = getUserPreference(userId);
  const view = buildTemplateView(preference.dataSource, preference.viewAsUserId);

  await client.views.open({
    trigger_id: triggerId,
    view,
  });
}

function buildTemplateView(dataSource: DataSourceOption, viewAsUserId?: string): View {
  const privateMetadata = JSON.stringify({ dataSource, viewAsUserId });
  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'In just a few minutes, I can compile a Canvas with hundreds of customer-facing datapoints, graphs, and insights to help you drive more effective (& efficient) meetings.',
      },
    },
  ];

  if (dataSource === 'prebuilt') {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Prebuilt mode shares the Canvas you selected in Settings once you complete the steps below.',
        },
      ],
    });
  }

  blocks.push({
    type: 'input',
    block_id: 'template_select',
    label: { type: 'plain_text', text: 'Template' },
    element: {
      type: 'static_select',
      action_id: 'template_action',
      options: [
        {
          text: { type: 'plain_text', text: 'Executive Brief' },
          value: 'executive_brief',
        },
        {
          text: { type: 'plain_text', text: 'ELT Brief (coming soon)' },
          value: 'elt_brief',
          description: { type: 'plain_text', text: 'Coming soon' },
        },
      ],
      initial_option: {
        text: { type: 'plain_text', text: 'Executive Brief' },
        value: 'executive_brief',
      },
    },
  });

  return {
    type: 'modal',
    callback_id: 'executive_brief_template',
    title: { type: 'plain_text', text: 'GSI - Executive Brief' },
    submit: { type: 'plain_text', text: 'Next' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: privateMetadata,
    blocks,
  };
}
