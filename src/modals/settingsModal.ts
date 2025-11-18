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
  statusMessage?: string;
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
  statusMessage,
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
  const blocks: any[] = [];

  if (statusMessage) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: statusMessage,
        },
      ],
    });
  }

  blocks.push(
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
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: 'settings_clear_messages',
          text: { type: 'plain_text', text: 'Clear Messages Tab' },
          style: 'primary',
          confirm: {
            title: { type: 'plain_text', text: 'Clear Messages?' },
            text: {
              type: 'mrkdwn',
              text: 'This removes all Global Sales Insights messages from your DM thread.',
            },
            confirm: { type: 'plain_text', text: 'Clear' },
            deny: { type: 'plain_text', text: 'Cancel' },
          },
        },
        {
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
      ],
    }
  );

  return {
    type: 'modal',
    callback_id: 'settings_modal',
    title: { type: 'plain_text', text: 'GSI Settings' },
    submit: { type: 'plain_text', text: 'Save' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks,
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
      statusMessage: 'Settings reset to defaults.',
    }),
  });
}

export async function handleSettingsClearMessages({
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
  const preference = getUserPreference(userId);
  let canvases: CanvasFileMeta[] = [];
  try {
    canvases = await listCanvasFiles(client);
  } catch (error) {
    console.warn('[settings] Unable to load Canvas list during clear', error);
  }

  let statusMessage = 'No messages to remove.';
  try {
    const deleted = await clearMessagesTab(client, userId);
    statusMessage =
      deleted > 0
        ? `Removed ${deleted} message${deleted === 1 ? '' : 's'} from your Messages tab.`
        : 'No Global Sales Insights messages were found to remove.';
  } catch (error) {
    console.warn('[settings] Unable to clear messages tab', error);
    statusMessage = 'Unable to clear the Messages tab. Please try again.';
  }

  await client.views.update({
    view_id: viewId,
    hash: viewHash,
    view: buildSettingsView({
      selectedSource: preference.dataSource,
      selectedCanvasId: preference.selectedCanvasId,
      selectedCanvasTitle: preference.selectedCanvasTitle,
      canvases,
      statusMessage,
    }),
  });
}

async function clearMessagesTab(client: WebClient, userId: string): Promise<number> {
  const [auth, dm] = await Promise.all([
    client.auth.test(),
    client.conversations.open({ users: userId }),
  ]);

  const channelId = dm.channel?.id;
  if (!channelId) {
    return 0;
  }

  const botUserId = auth.user_id;
  const botId = auth.bot_id;
  let deleted = 0;
  let cursor: string | undefined;

  do {
    const history = await client.conversations.history({
      channel: channelId,
      limit: 200,
      cursor,
    });
    const messages = history.messages || [];
    for (const message of messages) {
      const fromBot =
        (!!message.bot_id && botId && message.bot_id === botId) ||
        (!!message.user && botUserId && message.user === botUserId);
      if (!fromBot || !message.ts) {
        continue;
      }
      try {
        await client.chat.delete({ channel: channelId, ts: message.ts });
        deleted += 1;
      } catch (error) {
        console.warn('[settings] Failed to delete DM message', error);
      }
    }
    cursor = history.response_metadata?.next_cursor;
  } while (cursor);

  return deleted;
}
