import { WebClient, View } from '@slack/web-api';
import { getUserPreference, updateUserPreference } from '../store/userPrefs';
import { DataSourceOption } from '../types';

export async function openSettingsModal({
  client,
  triggerId,
  userId,
}: {
  client: WebClient;
  triggerId: string;
  userId: string;
}) {
  const preference = getUserPreference(userId);
  await client.views.open({
    trigger_id: triggerId,
    view: buildSettingsView(preference.dataSource),
  });
}

function buildSettingsView(selected: DataSourceOption): View {
  return {
    type: 'modal',
    callback_id: 'settings_modal',
    title: { type: 'plain_text', text: 'GSI Settings' },
    submit: { type: 'plain_text', text: 'Save' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Choose how the Executive Meeting Brief should source its content.',
        },
      },
      {
        type: 'input',
        block_id: 'data_source',
        label: { type: 'plain_text', text: 'Data Source' },
        element: {
          type: 'radio_buttons',
          action_id: 'data_source_action',
          initial_option: buildOption(selected),
          options: ['mock', 'llm', 'prebuilt'].map((value) => buildOption(value as DataSourceOption)),
        },
      },
    ],
  } as View;
}

function buildOption(value: DataSourceOption) {
  const labelMap: Record<DataSourceOption, string> = {
    mock: 'Mocked Data (demo dataset)',
    llm: 'LLM Generated (OpenAI)',
    prebuilt: 'Prebuilt Canvas (instant send)',
  };
  return {
    text: { type: 'plain_text', text: labelMap[value] },
    value,
  };
}

export async function handleSettingsSubmission({
  client,
  userId,
  dataSource,
}: {
  client: WebClient;
  userId: string;
  dataSource: DataSourceOption;
}) {
  updateUserPreference(userId, { dataSource });
  await client.chat.postMessage({
    channel: userId,
    text: `Settings saved. Data source set to *${dataSource.toUpperCase()}*.`,
  });
}
