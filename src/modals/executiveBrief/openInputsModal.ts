import { View } from '@slack/web-api';
import { DataSourceOption } from '../../types';
import { accountOptions, aovOptions } from '../../data/mockCustomerData';

interface BuildInputsModalArgs {
  dataSource: DataSourceOption;
  templateId: string;
  viewAsUserId?: string;
  prebuiltId?: string;
}

export function buildInputsModal({
  dataSource,
  templateId,
  viewAsUserId,
  prebuiltId,
}: BuildInputsModalArgs): View {
  const metadata = JSON.stringify({ dataSource, templateId, prebuiltId, viewAsUserId });

  return {
    type: 'modal',
    callback_id: 'executive_brief_inputs',
    private_metadata: metadata,
    title: { type: 'plain_text', text: 'GSI - Executive Brief' },
    submit: { type: 'plain_text', text: 'Generate' },
    close: { type: 'plain_text', text: 'Back' },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Template:* ${templateId === 'executive_brief' ? 'Executive Brief' : prebuiltId || templateId}\n*Data Source:* ${formatDataSourceLabel(dataSource)}`,
        },
      },
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
      },
    ],
  };
}

function formatDataSourceLabel(dataSource: DataSourceOption) {
  switch (dataSource) {
    case 'prebuilt':
      return 'Prebuilt Canvas';
    case 'llm':
      return 'LLM Generated';
    default:
      return 'Mocked Data';
  }
}
