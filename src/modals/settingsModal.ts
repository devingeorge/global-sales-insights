import { WebClient, View } from '@slack/web-api';
import { PlainTextOption } from '@slack/types';
import { getUserPreference, resetUserPreference, updateUserPreference } from '../store/userPrefs';
import { DataSourceOption } from '../types';
import { CanvasFileMeta, getCanvasFileById, listCanvasFiles, toSlackOption } from '../services/canvasFiles';

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
  let canvases: CanvasFileMeta[] = [];
  try {
    canvases = await listCanvasFiles(client);
  } catch (error) {
    console.warn('[settings] Unable to load Canvas list', error);
  }
  await client.views.open({
    trigger_id: triggerId,
    view: buildSettingsView({
      selectedSource: preference.dataSource,
      selectedCanvasId: preference.selectedCanvasId,
      selectedCanvasTitle: preference.selectedCanvasTitle,
      canvases,
    }),
  });
}

interface BuildSettingsArgs {
  selectedSource: DataSourceOption;
  selectedCanvasId?: string;
  selectedCanvasTitle?: string;
  canvases: CanvasFileMeta[];
}

interface SelectedCanvasOption {
  value?: string;
  text?: {
    text?: string;
  };
}

function buildSettingsView({
  selectedSource,
  selectedCanvasId,
  selectedCanvasTitle,
  canvases,
}: BuildSettingsArgs): View {
  const canvasOptions = canvases.map(toSlackOption);
  let selectedCanvas = canvasOptions.find((option) => option.value === selectedCanvasId);
  if (selectedCanvasId && !selectedCanvas && selectedCanvasTitle) {
    const fallbackOption: PlainTextOption = {
      text: { type: 'plain_text', text: `${selectedCanvasTitle} (not found)` },
      value: selectedCanvasId,
    };
    canvasOptions.unshift(fallbackOption);
    selectedCanvas = fallbackOption;
  }
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
          initial_option: buildOption(selectedSource),
          options: ['mock', 'llm', 'prebuilt'].map((value) => buildOption(value as DataSourceOption)),
        },
      },
      {
        type: 'input',
        block_id: 'canvas_select',
        optional: true,
        label: { type: 'plain_text', text: 'Slack Canvas (used when Prebuilt is selected)' },
        hint: {
          type: 'plain_text',
          text: canvasOptions.length ? 'Pick the Canvas you want sent instantly.' : 'No canvases found. Create one in Slack first.',
        },
        element: {
          type: 'static_select',
          action_id: 'canvas_select_action',
          placeholder: {
            type: 'plain_text',
            text: canvasOptions.length ? 'Select a Canvas' : 'No canvases available',
          },
          options: canvasOptions.length
            ? canvasOptions
            : [{ text: { type: 'plain_text', text: 'No canvases available' }, value: 'none' }],
          initial_option: selectedCanvas,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Need to start from scratch? Reset everything back to defaults.',
        },
        accessory: {
          type: 'button',
          action_id: 'settings_reset_action',
          text: { type: 'plain_text', text: 'Reset Settings' },
          style: 'danger',
          confirm: {
            title: { type: 'plain_text', text: 'Reset settings?' },
            text: {
              type: 'mrkdwn',
              text: 'This will clear your preferred data source, Canvas selection, and persona. Continue?',
            },
            confirm: { type: 'plain_text', text: 'Reset' },
            deny: { type: 'plain_text', text: 'Cancel' },
          },
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
  selectedCanvasOption,
}: {
  client: WebClient;
  userId: string;
  dataSource: DataSourceOption;
  selectedCanvasOption?: SelectedCanvasOption;
}) {
  let selectedCanvasId =
    selectedCanvasOption?.value && selectedCanvasOption.value !== 'none'
      ? selectedCanvasOption.value
      : undefined;
  let selectedCanvasTitle = selectedCanvasOption?.text?.text;

  if (selectedCanvasId && !selectedCanvasTitle) {
    const meta = await getCanvasFileById(client, undefined, selectedCanvasId);
    selectedCanvasTitle = meta?.title;
  }

  updateUserPreference(userId, {
    dataSource,
    selectedCanvasId,
    selectedCanvasTitle,
  });
  await client.chat.postMessage({
    channel: userId,
    text: `Settings saved. Data source set to *${dataSource.toUpperCase()}*${selectedCanvasId ? `, Canvas: *${selectedCanvasTitle}*.` : '.'}`,
  });
}

export async function handleSettingsReset({
  client,
  userId,
  viewId,
  viewHash,
}: {
  client: WebClient;
  userId: string;
  viewId: string;
  viewHash?: string;
}) {
  const preference = resetUserPreference(userId);
  let canvases: CanvasFileMeta[] = [];
  try {
    canvases = await listCanvasFiles(client);
  } catch (error) {
    console.warn('[settings] Unable to load Canvas list during reset', error);
  }
  await client.views.update({
    view_id: viewId,
    hash: viewHash,
    view: buildSettingsView({
      selectedSource: preference.dataSource,
      selectedCanvasId: preference.selectedCanvasId,
      selectedCanvasTitle: preference.selectedCanvasTitle,
      canvases,
    }),
  });
  await client.chat.postMessage({
    channel: userId,
    text: 'Settings reset to defaults.',
  });
}
