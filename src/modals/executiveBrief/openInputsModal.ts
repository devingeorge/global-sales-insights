import { View, KnownBlock } from '@slack/web-api';
import { DataSourceOption } from '../../types';
import { accountOptions, aovOptions } from '../../data/mockCustomerData';

interface BuildInputsModalArgs {
  dataSource: DataSourceOption;
  templateId: string;
  viewAsUserId?: string;
}

export function buildInputsModal({ dataSource, templateId, viewAsUserId }: BuildInputsModalArgs): View {
  const metadata = JSON.stringify({ dataSource, templateId, viewAsUserId });
  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Template:* ${templateId === 'executive_brief' ? 'Executive Brief' : templateId}\n*Data Source:* ${formatDataSourceLabel(
          dataSource
        )}`,
      },
    },
  ];

  if (dataSource === 'prebuilt') {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'I will share the Canvas you selected in Settings as soon as you submit these details.',
        },
      ],
    });
  }

  blocks.push(
    {
      type: 'input',
      block_id: 'view_as',
      label: { type: 'plain_text', text: 'View As' },
      element: {
        type: 'users_select',
        action_id: 'view_as_action',
        initial_user: viewAsUserId,
      },
    },
    {
      type: 'input',
      block_id: 'search_mode',
      label: { type: 'plain_text', text: 'Search Using' },
      element: {
        type: 'radio_buttons',
        action_id: 'search_mode_action',
        initial_option: {
          text: { type: 'plain_text', text: 'Account Name' },
          value: 'account',
        },
        options: [
          { text: { type: 'plain_text', text: 'Account Name' }, value: 'account' },
          { text: { type: 'plain_text', text: 'Company Name' }, value: 'company' },
        ],
      },
    },
    {
      type: 'input',
      block_id: 'account_select',
      label: { type: 'plain_text', text: 'Account' },
      element: {
        type: 'static_select',
        action_id: 'account_action',
        options: accountOptions,
      },
    },
    {
      type: 'input',
      block_id: 'local_aov',
      label: { type: 'plain_text', text: 'Local Name & AOV' },
      element: {
        type: 'static_select',
        action_id: 'local_aov_action',
        options: aovOptions,
      },
    }
  );

  return {
    type: 'modal',
    callback_id: 'executive_brief_inputs',
    private_metadata: metadata,
    title: { type: 'plain_text', text: 'GSI - Executive Brief' },
    submit: { type: 'plain_text', text: 'Generate' },
    close: { type: 'plain_text', text: 'Back' },
    blocks,
  };
}

function formatDataSourceLabel(dataSource: DataSourceOption) {
  switch (dataSource) {
    case 'prebuilt':
      return 'Prebuilt Slack Canvas';
    case 'llm':
      return 'LLM Generated';
    default:
      return 'Mocked Data';
  }
}

